module.exports = {
  extends: [
    'plugin:@sewing-kit/typescript',
    'plugin:@sewing-kit/react',
    'plugin:@sewing-kit/prettier',
  ],
  ignorePatterns: [
    'node_modules/',
    'build/',
    'packages/*/*.d.ts',
    'packages/*/build/',
    '!**/.eslintrc.js',
  ],
  overrides: [
    {
      files: ['sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
