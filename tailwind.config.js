/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Netflix Brand Colors */
        'netflix-black': '#141414',
        'netflix-dark': '#1f1f1f',
        'netflix-darker': '#2d2d2d',
        'netflix-red': '#E50914',
        'netflix-red-hover': '#f40612',
        'netflix-red-dark': '#c00812',
        
        /* Text Colors */
        'netflix-text': '#FFFFFF',
        'netflix-text-secondary': '#B3B3B3',
        'netflix-text-tertiary': '#757575',
        'netflix-text-muted': '#808080',
      },
      backgroundColor: {
        'netflix-bg': '#141414',
        'netflix-card': 'rgba(22, 22, 22, 0.7)',
      },
      fontSize: {
        'netflix-hero-mobile': ['28px', { lineHeight: '1.2' }],
        'netflix-hero-desktop': ['50px', { lineHeight: '1.2' }],
        'netflix-subtitle': ['20px', { lineHeight: '1.5' }],
        'netflix-section-head': ['26px', { lineHeight: '1.2' }],
        'netflix-caption': ['13px', { lineHeight: '1.5' }],
      },
      spacing: {
        'netflix-container-padding': '4%',
      },
      maxWidth: {
        'netflix-container': '1920px',
        'netflix-form': '450px',
        'netflix-faq': '815px',
      },
      borderRadius: {
        'netflix-sm': '3px',
        'netflix-md': '4px',
        'netflix-lg': '8px',
      },
      boxShadow: {
        'netflix-lg': '0 16px 32px rgba(0, 0, 0, 0.6)',
        'netflix-xl': '0 24px 48px rgba(0, 0, 0, 0.7)',
        'netflix-2xl': '0 40px 80px rgba(0, 0, 0, 0.8)',
      },
      transitionTimingFunction: {
        'netflix-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  // eslint-disable-next-line no-undef
  plugins: [require('tailwind-scrollbar-hide')],
};
