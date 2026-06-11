/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        sans: ['Archivo', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      colors: {
        paper: '#f6f1e7',
        card: '#fdfaf3',
        ink: '#191613',
        faded: '#8a8275',
        line: '#d8d0bf',
        pine: '#1f5e3d',
        signal: '#e2541b',
        gold: '#c9a227',
      },
      boxShadow: {
        flat: '4px 4px 0 0 #191613',
        flatSm: '2px 2px 0 0 #191613',
      },
    },
  },
  plugins: [],
}
