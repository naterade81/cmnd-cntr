/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#AF00F1',
          magenta: '#D900FF',
          cyan: '#00e5ff',
          green: '#4ade80',
          amber: '#fbbf24',
          red: '#ff4444',
        },
        surface: {
          bg: '#06070a',
          primary: '#0d1117',
          card: '#161b22',
          'card-hover': '#1c2333',
          border: '#30363d',
          'border-bright': '#484f58',
        },
        text: {
          primary: '#e6edf3',
          muted: '#8b949e',
        },
      },
      fontFamily: {
        display: ['Chakra Petch', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
