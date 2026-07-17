/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#ff7a1a',
          dark: '#9c4500',
          light: '#ffdbca',
        },
        maroon: {
          DEFAULT: '#a13c46',
          dark: '#7a1e2b',
          light: '#ffdada',
        },
        turmeric: {
          DEFAULT: '#fdbc13',
          dark: '#7a5900',
          light: '#ffdea3',
        },
        cream: {
          DEFAULT: '#fff8f1',
          dark: '#dfd9d1',
          light: '#ffffff',
          container: '#f4ede5',
          highest: '#e8e1da',
        },
        charcoal: '#1e1b17',
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Work Sans"', 'sans-serif'],
      },
      boxShadow: {
        'glass-warm': '0 20px 50px rgba(122, 30, 43, 0.08)',
        'glass-glow': '0 10px 30px rgba(255, 122, 26, 0.15)',
      },
    },
  },
  plugins: [],
}
