/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Institutional Minimal Color Palette
      colors: {
        // Primary backgrounds
        charcoal: {
          DEFAULT: '#0D0D0D',
          50: '#2D2D2D',
          100: '#262626',
          200: '#1F1F1F',
          300: '#1A1A1A',
          400: '#141414',
          500: '#0D0D0D',
          600: '#0A0A0A',
          700: '#070707',
          800: '#050505',
          900: '#020202',
        },
        // Accent colors
        profit: {
          DEFAULT: '#00FF88',
          light: '#33FF9F',
          dark: '#00CC6A',
        },
        loss: {
          DEFAULT: '#FF4D4D',
          light: '#FF7070',
          dark: '#CC3D3D',
        },
        // UI elements
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: '#242424',
          overlay: 'rgba(26, 26, 26, 0.8)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          focus: 'rgba(255, 255, 255, 0.2)',
        },
      },
      // Typography - Atkinson Hyperlegible / Inter
      fontFamily: {
        sans: ['Inter', 'Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // Glassmorphism effects
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glow-profit': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-loss': '0 0 20px rgba(255, 77, 77, 0.3)',
      },
      // Spacing for dashboard layouts
      spacing: {
        'sidebar': '280px',
        'header': '64px',
      },
      // Animation for live updates
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
