/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 莫蘭迪色系主題
        morandi: {
          // 主色調
          sage: '#9CAF9F',      // 鼠尾草綠
          rose: '#D4A5A5',      // 玫瑰粉
          lavender: '#B8A8C8',  // 薰衣草紫
          peach: '#E8C4A0',     // 蜜桃橘
          blue: '#A8B8C8',      // 霧霾藍
          cream: '#F0E6D6',     // 奶油色
          grey: '#C8C0B8',      // 暖灰色
          
          // 輔助色調
          'sage-light': '#B5C4B8',
          'sage-dark': '#7A9D7D',
          'rose-light': '#E0B8B8',
          'rose-dark': '#C49292',
          'lavender-light': '#C8BADB',
          'lavender-dark': '#A896B5',
          'peach-light': '#F0D1B3',
          'peach-dark': '#DDB78D',
          'blue-light': '#B8C4D1',
          'blue-dark': '#95A5B5',
          'cream-light': '#F5EDE0',
          'cream-dark': '#E6D7C2',
          'grey-light': '#D1C9C4',
          'grey-dark': '#B5ADA5',
        },
        
        // 系統色彩
        background: '#FEFEFE',
        surface: '#F9F7F5',
        'surface-alt': '#F2F0EE',
        border: '#E5E2E0',
        text: {
          primary: '#5A5A5A',
          secondary: '#8A8A8A',
          muted: '#B0B0B0',
        },
        
        // 狀態色彩 (莫蘭迪風格)
        success: '#9CAF9F',
        warning: '#E8C4A0',
        error: '#D4A5A5',
        info: '#A8B8C8',
      },
      
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'system-ui', 'sans-serif'],
      },
      
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
      },
      
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}