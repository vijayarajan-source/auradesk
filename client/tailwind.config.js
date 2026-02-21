/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#F5E6B8',
                    400: '#E6C56B',
                    500: '#C9A84C',
                    600: '#B7932F',
                    700: '#92711C',
                    800: '#6D530F',
                    900: '#4A3808',
                },
                cream: {
                    50: '#FFFEF9',
                    100: '#FFFCF0',
                    200: '#FFF8E1',
                    300: '#FFF3CC',
                    DEFAULT: '#FFF8EC',
                },
                aura: {
                    bg: '#FAFAFA',
                    card: 'rgba(255,255,255,0.75)',
                    border: 'rgba(201,168,76,0.2)',
                    shadow: 'rgba(201,168,76,0.12)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            backgroundImage: {
                'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #E6C56B 50%, #C9A84C 100%)',
                'gold-soft': 'linear-gradient(135deg, #F5E6B8 0%, #FFF8EC 100%)',
                'glass': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,253,245,0.8) 100%)',
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(201,168,76,0.12), 0 2px 8px rgba(0,0,0,0.04)',
                'glass-lg': '0 20px 60px rgba(201,168,76,0.15), 0 4px 16px rgba(0,0,0,0.06)',
                'gold': '0 4px 20px rgba(201,168,76,0.35)',
                'gold-sm': '0 2px 8px rgba(201,168,76,0.25)',
                'inner-gold': 'inset 0 1px 0 rgba(255,255,255,0.6)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            backdropBlur: {
                xs: '2px',
                sm: '4px',
                DEFAULT: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'pulse-gold': 'pulseGold 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
                slideIn: { '0%': { opacity: 0, transform: 'translateX(-16px)' }, '100%': { opacity: 1, transform: 'translateX(0)' } },
                pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(201,168,76,0)' } },
                float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
            },
        },
    },
    plugins: [],
}
