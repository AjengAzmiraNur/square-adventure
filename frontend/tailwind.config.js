/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#172554', 900: '#0f1a3d', 800: '#172554', 700: '#1e3a8a' },
        royal: '#2563EB',
        sky: '#60A5FA',
        lilac: '#A78BFA',
        mint: '#6EE7B7',
        sun: '#FACC15',
        snow: '#F8FAFC',
        ink: '#1E293B',
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        block: '0 6px 0 0 rgba(15, 26, 61, 0.35)',
        soft: '0 10px 30px -12px rgba(15, 26, 61, 0.35)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(0.6)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        rise: { '0%': { transform: 'translateY(12px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
      },
      animation: {
        pop: 'pop 0.35s ease-out both',
        rise: 'rise 0.4s ease-out both',
        bob: 'bob 3s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out 2',
      },
    },
  },
  plugins: [],
}
