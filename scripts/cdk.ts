import * as path from 'path';
import {execSync} from 'child_process';
import {stripIndent} from 'common-tags';

const [, , action, cdk] = process.argv;

if (action && cdk) {
  execSync(
    `node_modules/.bin/cdk ${action} --app ${JSON.stringify(
      `npx babel-node --extensions .ts,.tsx,.mjs,.js,.json ${
        cdk.includes(path.sep) && cdk.includes('.')
          ? cdk
          : path.join('config/deploy', cdk.endsWith('.ts') ? cdk : `${cdk}.ts`)
      }`,
    )}`,
    {
      stdio: 'inherit',
    },
  );
} else {
  // eslint-disable-next-line no-console
  console.error(stripIndent`
    You must provide the command for the CDK command, and the name of a CDK file in ./config/deploy, as arguments to this command
    (e.g., \`yarn cdk deploy LemonCdn\`)
  `);

  process.exitCode = 1;
}
