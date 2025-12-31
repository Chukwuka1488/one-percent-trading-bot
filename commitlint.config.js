module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce lowercase for subject (no sentence-case, start-case, pascal-case, upper-case)
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    // Enforce lowercase for type
    'type-case': [2, 'always', 'lower-case'],
    // Enforce lowercase for scope
    'scope-case': [2, 'always', 'lower-case'],
    // Header max length (prefer 50, max 72)
    'header-max-length': [2, 'always', 72],
    // Body max line length
    'body-max-line-length': [2, 'always', 72],
  },
};
