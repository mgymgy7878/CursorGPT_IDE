/**
 * ESLint Rule: Prevent render-time nondeterministic values
 *
 * Bu kural, JSX içinde render-time'da çalışan nondeterministic değerleri yakalar:
 * - new Date() / Date.now() → SSR/client mismatch
 * - Math.random() → Her render'da farklı
 * - crypto.randomUUID() → Her render'da farklı
 *
 * Kullanım:
 * .eslintrc.json içinde extends array'ine eklenmiştir.
 */

module.exports = {
  rules: {
    // JSX içinde new Date() kullanımını yasakla
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXExpressionContainer > CallExpression[callee.name="Date"]',
        message: 'Avoid new Date() in JSX. Use ClientTime or ClientDateTime component instead to prevent hydration mismatch.',
      },
      {
        selector: 'JSXExpressionContainer > MemberExpression[object.name="Date"][property.name="now"]',
        message: 'Avoid Date.now() in JSX. Use ClientTime or calculate in useEffect instead.',
      },
      {
        selector: 'JSXExpressionContainer > CallExpression[callee.object.name="Date"][callee.property.name="now"]',
        message: 'Avoid Date.now() in JSX. Use ClientTime or calculate in useEffect instead.',
      },
      {
        selector: 'JSXExpressionContainer > CallExpression[callee.object.name="Math"][callee.property.name="random"]',
        message: 'Avoid Math.random() in JSX. Generate in useEffect or use deterministic values.',
      },
      {
        selector: 'JSXExpressionContainer > CallExpression[callee.object.name="crypto"][callee.property.name="randomUUID"]',
        message: 'Avoid crypto.randomUUID() in JSX. Generate in useEffect or use deterministic IDs.',
      },
      {
        selector: 'JSXExpressionContainer > CallExpression[callee.property.name="toLocaleString"]',
        message: 'Avoid toLocaleString() in JSX. Use ClientTime or ClientDateTime component instead.',
      },
    ],
  },
};

