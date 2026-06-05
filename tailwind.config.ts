import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        meigoku: {
          bg: '#0b0612',
          panel: '#160b22',
          border: '#2a1741',
          accent: '#a06bff',
          gold: '#e8c66a',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
