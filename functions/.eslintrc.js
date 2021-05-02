module.exports = {
  extends: [
    'plugin:@sewing-kit/typescript',
    'plugin:@sewing-kit/prettier',
    'plugin:@sewing-kit/node',
  ],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/class-name-casing': 'off',
  },
  overrides: [
    {
      files: ['**/sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['**/infrastructure/**/*', '**/infrastructure.ts'],
      rules: {
        // The CDK uses classes for everything, so this rule is violated
        // constantly :(
        'no-new': 'off',
        // Don’t want to install the CDK all over the place
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
