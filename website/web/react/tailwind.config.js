/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        void: '#07070f',
        'void-light': '#0d111d',
        surface: '#151928',
        'surface-hover': '#1e2438',
        teal: '#00f0ff',
        blue: '#4d7cff',
        purple: '#8b5cf6',
        muted: '#8a8f98',
        'wave-dark': '#050505',
        'wave-panel': '#0a0a0a',
        'wave-border': 'rgba(255,255,255,0.08)',
      },
      animation: {
        flow: 'flow 10s ease-in-out infinite alternate',
        'flow-slow': 'flow 15s ease-in-out infinite alternate-reverse',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        blob: 'blob 10s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        flow: {
          '0%': { transform: 'scale(1) translate(0px, 0px) rotate(0deg)' },
          '50%': { transform: 'scale(1.1) translate(2vw, 2vh) rotate(2deg)' },
          '100%': { transform: 'scale(1.05) translate(-2vw, -1vh) rotate(-1deg)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
