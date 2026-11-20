import { db } from '@/lib/supabase/admin';
import { currentMonthRange, lastMonthKeys, monthKey } from '@/lib/format';
import type {
  Account,
  Budget,
  ConversationLog,
  Recurring,
  Reminder,
  Transaction,
} from '@/lib/types';

export type AccountWithBalance = Account & { balance: number };

export type DashboardData = {
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  totalBalance: number;
  accounts: AccountWithBalance[];
  budgets: Array<Budget & { used: number; percent: number }>;
  trend: Array<{ key: string; income: number; expense: number }>;
  categories: Array<{ category: string; total: number; percent: number }>;
  recent: Transaction[];
  monthIncomeCount: number;
  monthExpenseCount: number;
};

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function transferEffect(tx: Transaction, accountId: string) {
  if (tx.kind === 'Pemasukan') return tx.account_id === accountId ? num(tx.amount) : 0;
  if (tx.kind === 'Pengeluaran') return tx.account_id === accountId ? -num(tx.amount) : 0;
  if (tx.kind === 'Transfer') {
    let delta = 0;
    if (tx.account_id === accountId) delta -= num(tx.amount);
    if (tx.to_account_id === accountId) delta += num(tx.amount);
    return delta;
  }
  return 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = db();
  const { start, end } = currentMonthRange();
  const months = lastMonthKeys(6);
  const trendStart = `${months[0]}-01`;

  const [accountsRes, budgetsRes, allTxRes, trendTxRes, recentRes] = await Promise.all([
    supabase.from('accounts').select('*').order('name'),
    supabase.from('budgets').select('*').eq('active', true).order('category'),
    supabase
      .from('transactions')
      .select('id, occurred_at, kind, category, amount, account_id, to_account_id')
      .is('deleted_at', null),
    supabase
      .from('transactions')
      .select('occurred_at, kind, amount, category')
      .is('deleted_at', null)
      .gte('occurred_at', trendStart)
      .lt('occurred_at', end),
    supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(8),
  ]);

  const accounts = (accountsRes.data ?? []) as Account[];
  const budgets = (budgetsRes.data ?? []) as Budget[];
  const allTx = (allTxRes.data ?? []) as unknown as Transaction[];
  const trendTx = (trendTxRes.data ?? []) as unknown as Transaction[];
  const recent = (recentRes.data ?? []) as Transaction[];

  const accountsWithBalance: AccountWithBalance[] = accounts.map((account) => ({
    ...account,
    balance:
      num(account.opening_balance) +
      allTx.reduce((sum, tx) => sum + transferEffect(tx, account.id), 0),
  }));

  const currentTx = allTx.filter((tx) => monthKey(tx.occurred_at) === monthKey(start));
  const monthIncome = currentTx
    .filter((tx) => tx.kind === 'Pemasukan')
    .reduce((sum, tx) => sum + num(tx.amount), 0);
  const monthExpense = currentTx
    .filter((tx) => tx.kind === 'Pengeluaran')
    .reduce((sum, tx) => sum + num(tx.amount), 0);

  const trend = months.map((key) => {
    const rows = trendTx.filter((tx) => monthKey(tx.occurred_at) === key);
    return {
      key,
      income: rows
        .filter((tx) => tx.kind === 'Pemasukan')
        .reduce((sum, tx) => sum + num(tx.amount), 0),
      expense: rows
        .filter((tx) => tx.kind === 'Pengeluaran')
        .reduce((sum, tx) => sum + num(tx.amount), 0),
    };
  });

  const categoryMap = new Map<string, number>();
  for (const tx of currentTx) {
    if (tx.kind !== 'Pengeluaran') continue;
    categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + num(tx.amount));
  }
  const categories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, total]) => ({
      category,
      total,
      percent: monthExpense > 0 ? Math.round((total / monthExpense) * 100) : 0,
    }));

  const budgetUsage = budgets.map((budget) => {
    const used = currentTx
      .filter((tx) => tx.kind === 'Pengeluaran' && tx.category === budget.category)
      .reduce((sum, tx) => sum + num(tx.amount), 0);
    const limit = num(budget.monthly_limit);
    return { ...budget, used, percent: limit > 0 ? Math.round((used / limit) * 100) : 0 };
  });

  return {
    monthIncome,
    monthExpense,
    monthNet: monthIncome - monthExpense,
    totalBalance: accountsWithBalance.reduce((sum, account) => sum + account.balance, 0),
    accounts: accountsWithBalance,
    budgets: budgetUsage,
    trend,
    categories,
    recent,
    monthIncomeCount: currentTx.filter((tx) => tx.kind === 'Pemasukan').length,
    monthExpenseCount: currentTx.filter((tx) => tx.kind === 'Pengeluaran').length,
  };
}

export type TransactionFilters = {
  from?: string;
  to?: string;
  kind?: string;
  category?: string;
  account?: string;
  q?: string;
  page?: number;
};

export async function getTransactions(filters: TransactionFilters) {
  const supabase = db();
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = 20;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.from) query = query.gte('occurred_at', filters.from);
  if (filters.to) query = query.lte('occurred_at', filters.to);
  if (filters.kind) query = query.eq('kind', filters.kind);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.account) query = query.eq('account_id', filters.account);
  if (filters.q) {
    const safe = filters.q.replace(/[%_]/g, '');
    query = query.or(`note.ilike.%${safe}%,category.ilike.%${safe}%,id.ilike.%${safe}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []) as Transaction[],
    total: count ?? 0,
    page,
    pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}

export async function getTransaction(id: string) {
  const { data, error } = await db()
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Transaction | null;
}

export async function getAccounts() {
  const { data, error } = await db().from('accounts').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

export async function getBudgets() {
  const { data, error } = await db().from('budgets').select('*').order('category');
  if (error) throw new Error(error.message);
  return (data ?? []) as Budget[];
}

export async function getCategories() {
  const { data, error } = await db()
    .from('transactions')
    .select('category')
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => String(row.category)).filter(Boolean))].sort();
}

export async function getRecurring() {
  const { data, error } = await db().from('recurring').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Recurring[];
}

export async function getReminders() {
  const { data, error } = await db()
    .from('reminders')
    .select('*')
    .order('next_run_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Reminder[];
}

export type LogFilters = {
  direction?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
};

export async function getConversationLogs(filters: LogFilters) {
  const page = Math.max(1, Number(filters.page ?? 1));
  const pageSize = 30;
  const from = (page - 1) * pageSize;

  let query = db()
    .from('conversation_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.direction) query = query.eq('direction', filters.direction);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00+07:00`);
  if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59+07:00`);
  if (filters.q) {
    const safe = filters.q.replace(/[%_]/g, '');
    query = query.ilike('text', `%${safe}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []) as ConversationLog[],
    total: count ?? 0,
    page,
    pages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  };
}
