module.exports = {
  extends: [
    'plugin:@sewing-kit/typescript',
    'plugin:@sewing-kit/prettier',
    'plugin:@sewing-kit/react',
  ],
  overrides: [
    {
      files: ['**/sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
