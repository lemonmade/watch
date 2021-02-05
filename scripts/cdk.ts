import * as path from 'path';
import {execSync} from 'child_process';
import {stripIndent} from 'common-tags';

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, 'build/cdk/services');
const [, , action] = process.argv;

if (action) {
  execSync(`rm -rf ${buildDir}`);
  execSync(`mkdir -p ${buildDir}`);
  // execSync(`zip -r ${path.join(buildDir, 'api.zip')} ./*`, {
  //   cwd: path.join(root, 'build/service'),
  // });
  // execSync(
  //   `zip -r ${path.join(buildDir, 'assets-brotli-path-rewrite.zip')} ./*`,
  //   {
  //     cwd: path.join(root, 'functions/assets-brotli-path-rewrite'),
  //   },
  // );
  // execSync(`zip -r ${path.join(buildDir, 'assets-header-rewrite.zip')} ./*`, {
  //   cwd: path.join(root, 'functions/assets-header-rewrite'),
  // });

  execSync(
    `node_modules/.bin/cdk ${action} --app ${JSON.stringify(
      `node_modules/.bin/babel-node --extensions .ts,.tsx,.mjs,.js,.json config/deploy/cdk.ts`,
    )}`,
    {
      stdio: 'inherit',
    },
  );
} else {
  // eslint-disable-next-line no-console
  console.error(stripIndent`
    You must provide a command for the CDK (e.g., \`yarn cdk deploy\`)
  `);

  process.exitCode = 1;
}
