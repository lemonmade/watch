module.exports = {
  extends: [
    'plugin:@sewing-kit/typescript',
    'plugin:@sewing-kit/prettier',
    'plugin:@sewing-kit/react',
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/class-name-casing': 'off',
    'react/jsx-curly-newline': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['graphql/types/*', '**/*.graphql.d.ts'],
  overrides: [
    {
      files: ['**/sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
