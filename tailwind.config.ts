import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Primary - 조선 전통색 */
        primary: {
          DEFAULT: '#8B4513',      // 갈색 (목재)
          light: '#A0522D',
          dark: '#654321',
        },

        /* Secondary - 한지/엽전 */
        secondary: '#F5E6D3',      // 한지색
        accent: {
          DEFAULT: '#D4A574',      // 엽전 금색
          dark: '#B8860B',
        },

        /* 오행 색상 (기존 유지) */
        wood: '#2D8659',           // 목(木)
        fire: '#E63946',           // 화(火)
        earth: '#F4A261',          // 토(土)
        metal: '#CBD5E1',          // 금(金)
        water: '#264653',          // 수(水)

        /* Neutral */
        bg: '#FBF8F3',             // 한지 배경
        text: '#2D2D2D',
        'text-secondary': '#6B6B6B',
        border: '#D4C5B9',
      },
      fontFamily: {
        sans: ['Pretendard Variable', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'hanji': '0 4px 12px rgba(139, 69, 19, 0.12)',
        'hanji-lg': '0 8px 24px rgba(139, 69, 19, 0.16)',
      },
      backgroundImage: {
        'hanji-texture': "url('/images/hanji-texture.webp')",
      },
    },
  },
  plugins: [],
} satisfies Config
