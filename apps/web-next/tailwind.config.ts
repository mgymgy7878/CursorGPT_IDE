import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: { 
        xl: '16px', 
        '2xl': '24px' 
      },
      spacing: { 
        4: '1rem', 
        6: '1.5rem', 
        8: '2rem' 
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: 'hsl(var(--surface))',
        card: 'hsl(var(--card))',
        success: 'hsl(var(--success))',
        warn: 'hsl(var(--warn))',
        danger: 'hsl(var(--danger))',
        status: {
          success: { DEFAULT: '#10B981', fg: '#052e1f' },
          warn: { DEFAULT: '#F59E0B', fg: '#3a2500' },
          error: { DEFAULT: '#EF4444', fg: '#3b0a0a' },
          info: { DEFAULT: '#3B82F6', fg: '#0a153b' },
          neutral: { DEFAULT: '#6B7280', fg: '#111827' },
        },
      },
    },
  },
  plugins: [],
}

export default config
