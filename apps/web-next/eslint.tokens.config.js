import regex from 'eslint-plugin-regex';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**']
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { regex },
    rules: {
      'regex/invalid': [
        'error',
        [
          {
            id: 'no-tailwind-arbitrary',
            message: 'Tailwind arbitrary values ([]) yasak — token-only.',
            regex: String.raw`className\s*=\s*(?:\`[^\`]*\[[^\`]*\`|"[^"]*\[[^"]*"|'[^']*\[[^']*')`
          }
        ]
      ]
    }
  }
];


