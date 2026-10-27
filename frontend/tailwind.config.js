/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        auren: {
          espresso: '#271E18',
          walnut: '#503625',
          brass: '#A7824B',
          ivory: '#F7F4EE',
          sand: '#D2C8BA',
          canvas: '#FCF9F3',
          dark: '#0D0703',
        },
      },
      fontFamily: {
        serif: ['"EB Garamond"', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        auren: '0.125rem', // 2px architectural subtle radius
      },
    },
  },
  plugins: [],
};
