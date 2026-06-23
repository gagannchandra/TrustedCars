/**
 * TrustedCars Tailwind Configuration
 * Design System v1.0
 * 
 * This configuration extends Tailwind with our custom design tokens.
 * Copy this to tailwind.config.js or merge with existing config.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ============================================
      // COLOR SYSTEM
      // ============================================
      colors: {
        primary: {
          50: '#F5FAFF',
          100: '#E6F2FF',
          500: '#2B6CB8',
          600: '#1E5AA8',
          700: '#0D4A8F',
          800: '#0B3A6E',
          900: '#082A4F',
          DEFAULT: '#0B3A6E',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#34D399',
          600: '#10B981',
          700: '#059669',
          DEFAULT: '#10B981',
        },
        ice: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#BAE6FD',
          600: '#7DD3FC',
          DEFAULT: '#BAE6FD',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          DEFAULT: '#F59E0B',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        error: {
          50: '#FEF2F2',
          600: '#DC2626',
          DEFAULT: '#DC2626',
        },
        warning: {
          50: '#FFFBEB',
          600: '#D97706',
          DEFAULT: '#D97706',
        },
        info: {
          50: '#EFF6FF',
          600: '#2563EB',
          DEFAULT: '#2563EB',
        },
      },

      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        display: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'], // Default
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],       // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],      // 14px
        base: ['1rem', { lineHeight: '1.5' }],        // 16px
        lg: ['1.125rem', { lineHeight: '1.5' }],      // 18px
        xl: ['1.25rem', { lineHeight: '1.5' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '1.375' }],   // 24px
        '3xl': ['1.875rem', { lineHeight: '1.375' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.25' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1.25' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '1.25' }],   // 60px
        '7xl': ['4.5rem', { lineHeight: '1.25' }],    // 72px
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '1.75',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      // ============================================
      // SPACING
      // ============================================
      spacing: {
        0: '0',
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        5: '1.25rem',   // 20px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        10: '2.5rem',   // 40px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
        20: '5rem',     // 80px
        24: '6rem',     // 96px
        32: '8rem',     // 128px
      },

      // ============================================
      // LAYOUT
      // ============================================
      maxWidth: {
        'container-sm': '640px',
        'container-md': '768px',
        'container-lg': '1024px',
        'container-xl': '1280px',
        'container-2xl': '1440px',
        'container-max': '1600px',
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        none: '0',
        sm: '0.25rem',    // 4px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.5rem',  // 24px
        full: '9999px',
      },

      // ============================================
      // SHADOWS
      // ============================================
      boxShadow: {
        xs: '0 1px 2px rgba(11, 58, 110, 0.05)',
        sm: '0 1px 3px rgba(11, 58, 110, 0.08), 0 1px 2px rgba(11, 58, 110, 0.06)',
        md: '0 4px 6px rgba(11, 58, 110, 0.07), 0 2px 4px rgba(11, 58, 110, 0.06)',
        lg: '0 10px 15px rgba(11, 58, 110, 0.08), 0 4px 6px rgba(11, 58, 110, 0.05)',
        xl: '0 20px 25px rgba(11, 58, 110, 0.1), 0 10px 10px rgba(11, 58, 110, 0.04)',
        '2xl': '0 25px 50px rgba(11, 58, 110, 0.15)',
        'success': '0 4px 20px rgba(16, 185, 129, 0.25)',
        'success-lg': '0 8px 30px rgba(16, 185, 129, 0.35)',
        'primary': '0 4px 20px rgba(27, 90, 168, 0.25)',
        'primary-lg': '0 8px 30px rgba(27, 90, 168, 0.35)',
        'amber': '0 4px 20px rgba(245, 158, 11, 0.25)',
        'amber-lg': '0 8px 30px rgba(245, 158, 11, 0.35)',
        none: 'none',
      },

      // ============================================
      // GRADIENTS
      // ============================================
      backgroundImage: {
        'gradient-hero-primary': 'linear-gradient(135deg, #0D4A8F 0%, #0B3A6E 50%, #082A4F 100%)',
        'gradient-hero-premium': 'linear-gradient(135deg, #0B3A6E 0%, #1E5AA8 25%, #2B6CB8 50%, #1E5AA8 75%, #0B3A6E 100%)',
        'gradient-hero-light': 'linear-gradient(to bottom, #F5FAFF 0%, #E6F2FF 50%, #FFFFFF 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-amber': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-premium-card': 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)',
        'gradient-shimmer': 'linear-gradient(90deg, #F1F5F9 0%, #F8FAFC 50%, #F1F5F9 100%)',
      },

      // ============================================
      // ANIMATIONS & TRANSITIONS
      // ============================================
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        slower: '400ms',
      },
      animation: {
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'checkmark': 'checkmarkDraw 0.4s ease forwards',
        'shake': 'shake 0.4s ease',
        'fade-in-up': 'fadeInUp 0.4s ease both',
        'slide-in-right': 'slideInRight 0.4s ease both',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        checkmarkDraw: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },

      // ============================================
      // Z-INDEX
      // ============================================
      zIndex: {
        base: '0',
        dropdown: '100',
        sticky: '200',
        fixed: '300',
        'modal-backdrop': '400',
        modal: '500',
        popover: '600',
        tooltip: '700',
      },

      // ============================================
      // BACKDROP
      // ============================================
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '20px',
        xl: '40px',
      },

      // ============================================
      // ASPECT RATIOS
      // ============================================
      aspectRatio: {
        square: '1 / 1',
        video: '16 / 9',
        card: '4 / 3',
        portrait: '3 / 4',
        wide: '21 / 9',
      },
    },
  },
  plugins: [
    // Add any required plugins here
    // e.g., @tailwindcss/forms, @tailwindcss/typography
  ],
}
