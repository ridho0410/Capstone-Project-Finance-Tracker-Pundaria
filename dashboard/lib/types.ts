export type TxKind = 'Pemasukan' | 'Pengeluaran' | 'Transfer';

export type Transaction = {
  id: string;
  occurred_at: string;
  kind: TxKind | string;
  category: string;
  amount: number;
  note: string | null;
  source: string | null;
  telegram_message_id: number | null;
  account_id: string;
  to_account_id: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type Account = {
  id: string;
  name: string;
  kind: string;
  opening_balance: number;
  is_default: boolean;
  active: boolean;
  created_at: string;
};

export type Budget = {
  category: string;
  monthly_limit: number;
  active: boolean;
  updated_at: string;
};

export type Recurring = {
  id: number;
  name: string;
  kind: string;
  category: string;
  amount: number;
  account_id: string;
  note: string;
  day_of_month: number;
  active: boolean;
  last_run: string | null;
  created_at: string;
};

export type Reminder = {
  id: number;
  teks: string;
  pola: string;
  jam: string | null;
  next_run_at: string;
  aktif: boolean;
  terkirim_terakhir: string | null;
  created_at: string;
};

export type ConversationLog = {
  id: number;
  chat_id: number;
  message_id: number | null;
  direction: 'in' | 'out';
  kind: string | null;
  text: string | null;
  intent: string | null;
  workflow: string | null;
  execution_id: string | null;
  created_at: string;
};
