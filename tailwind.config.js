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
                primary: {
                    light: '#6366f1',
                    DEFAULT: '#4f46e5',
                    dark: '#4338ca',
                },
                surface: {
                    light: '#ffffff',
                    dark: '#0f172a',
                },
                background: {
                    light: '#f8fafc',
                    dark: '#020617',
                },
                text: {
                    main: '#0f172a',
                    sub: '#64748b',
                    'main-dark': '#f8fafc',
                    'sub-dark': '#94a3b8',
                }
            }
        },
    },
    plugins: [],
}
