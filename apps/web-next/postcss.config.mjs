/** @type {import('postcss-load-config').Config} */
// DİKKAT: compile hang izolasyonu için tailwind disable bayrağı
const noTailwind = process.env.SPARK_NO_TAILWIND === '1'

export default {
  plugins: {
    ...(noTailwind ? {} : { tailwindcss: {} }),
    autoprefixer: {},
  },
};


