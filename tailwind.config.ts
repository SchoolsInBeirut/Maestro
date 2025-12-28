import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#d4af37',
        'brand-gold-soft': '#e8d9a8',
        'brand-red': '#8b0000',
        'brand-neutral': '#f8f7f4',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        xl: '18px',
      }
    },
  },
  plugins: [],
};

export default config;
