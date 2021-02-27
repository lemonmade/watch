module.exports = {
  extends: ['plugin:@sewing-kit/typescript', 'plugin:@sewing-kit/prettier'],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'packages/*/*.d.ts',
    'packages/*/*.mjs',
    'packages/*/*.esnext',
    'packages/*/build/',
    'app/graphql/types*',
    '**/*.graphql.d.ts',
    '**/*.graphql.ts',
    '!**/.eslintrc.js',
  ],
  settings: {
    'import/external-module-folders': ['node_modules', 'packages'],
  },
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'no-nested-ternary': 'off',
  },
  overrides: [
    {
      files: ['**/sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
