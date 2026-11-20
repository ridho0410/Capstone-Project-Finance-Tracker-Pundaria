type IconName =
  | 'dashboard'
  | 'transactions'
  | 'wallet'
  | 'budget'
  | 'repeat'
  | 'bell'
  | 'logs'
  | 'help'
  | 'logout'
  | 'plus'
  | 'search'
  | 'arrow';

const paths: Record<IconName, string> = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  transactions: 'M7 7h13M7 12h13M7 17h13M3 7h.01M3 12h.01M3 17h.01',
  wallet: 'M4 7h16v12H4V7Zm0 0 2.5-3h11L20 7M16 13h2',
  budget: 'M12 3v18M5 8h14M5 16h14',
  repeat: 'M17 2l4 4-4 4M7 22l-4-4 4-4M21 6H8a4 4 0 0 0-4 4M3 18h13a4 4 0 0 0 4-4',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
  logs: 'M4 5h16M4 12h16M4 19h10',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01',
  logout: 'M10 17l5-5-5-5M15 12H3M14 3h6v18h-6',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
