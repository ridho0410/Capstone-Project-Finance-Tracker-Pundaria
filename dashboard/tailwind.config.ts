import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b1220',
        panel: '#ffffff',
        line: '#e2e8f0',
        mint: '#059669',
        sky: '#0284c7',
        rose: {
          DEFAULT: '#e11d48',
          50: '#fff1f2',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
        amber: '#d97706',
      },
    },
  },
  plugins: [],
};

export default config;
