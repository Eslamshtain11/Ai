module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0A192F',
        'brand-navy': '#172A46',
        'brand-gold': '#D4AF37',
        'brand-light': '#CCD6F6',
        'brand-secondary': '#8892B0'
      },
      fontFamily: {
        cairo: ['"Cairo"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(2,12,27,0.3)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
