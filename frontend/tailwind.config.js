/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rpg: {
          darkest: '#070A10',
          dark: '#0B0F19',
          panel: '#111827',
          card: '#162032',
          cardHover: '#1B273E',
          border: '#1F2E47',
          borderHighlight: '#2E4469',
          gold: '#FBBF24',
          goldGlow: '#F59E0B',
          mana: '#06B6D4',
          manaGlow: '#22D3EE',
          vitality: '#10B981',
          vitalityGlow: '#34D399',
          aura: '#8B5CF6',
          auraGlow: '#A78BFA'
        },
        domain: {
          mental: {
            DEFAULT: '#06B6D4',
            light: '#22D3EE',
            dark: '#0891B2',
            bg: 'rgba(6, 182, 212, 0.12)',
            border: 'rgba(6, 182, 212, 0.35)'
          },
          health: {
            DEFAULT: '#10B981',
            light: '#34D399',
            dark: '#059669',
            bg: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.35)'
          },
          skill: {
            DEFAULT: '#8B5CF6',
            light: '#A78BFA',
            dark: '#7C3AED',
            bg: 'rgba(139, 92, 246, 0.12)',
            border: 'rgba(139, 92, 246, 0.35)'
          }
        }
      },
      boxShadow: {
        'glow-mental': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'glow-health': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
        'glow-skill': '0 0 20px -3px rgba(139, 92, 246, 0.45)',
        'glow-gold': '0 0 20px -3px rgba(251, 191, 36, 0.45)',
        'tactile': '0 4px 0 0 rgba(0, 0, 0, 0.4)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-up': 'floatUp 1.2s ease-out forwards',
        'breathing': 'breathe 16s ease-in-out infinite'
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.9)' },
          '20%': { opacity: '1', transform: 'translateY(-5px) scale(1.05)' },
          '80%': { opacity: '1', transform: 'translateY(-20px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-30px) scale(0.95)' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', borderColor: 'rgba(6, 182, 212, 0.4)' },
          '25%': { transform: 'scale(1.35)', borderColor: 'rgba(34, 211, 238, 0.9)' },
          '50%': { transform: 'scale(1.35)', borderColor: 'rgba(139, 92, 246, 0.9)' },
          '75%': { transform: 'scale(1)', borderColor: 'rgba(16, 185, 129, 0.4)' }
        }
      }
    },
  },
  plugins: [],
}
