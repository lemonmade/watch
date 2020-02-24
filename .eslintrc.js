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
  settings: {
    'import/external-module-folders': ['node_modules', 'packages'],
  },
  rules: {
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'no-nested-ternary': 'off',
  },
  overrides: [
    {
      files: ['sewing-kit.config.ts', 'config/sewing-kit/**/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
