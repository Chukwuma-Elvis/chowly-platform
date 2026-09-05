/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Fine-dining palette taken from the Figma Make design.
        cream: '#F6F1E7',
        sand: '#EDE4D3',
        surface: '#FCFAF5',
        ink: '#2B2320',
        muted: '#8A8079',
        clay: {
          DEFAULT: '#C0563B',
          dark: '#A8472F',
          soft: '#E8C7BB',
          tint: '#F5E7E1',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 35, 32, 0.04), 0 8px 24px rgba(43, 35, 32, 0.06)',
      },
    },
  },
  plugins: [],
};
