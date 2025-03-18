import * as path from 'node:path';

import {Cloudflare} from 'cloudflare';
import spawn from 'nano-spawn';

import {decryptFile} from '../../tools/secrets/decrypt.ts';

const cloudflare = new Cloudflare();

const gitHash =
  process.env.PREVIEW_COMMIT ??
  (await spawn('git', ['rev-parse', 'HEAD'])).output;

const dispatchNamespace = 'watch-previews';
const dispatchName = `app.${gitHash}`;

const deployCommand = spawn('pnpm', [
  `exec`,
  `wrangler`,
  `deploy`,
  `--dispatch-namespace`,
  dispatchNamespace,
  `--name`,
  dispatchName,
  `--config`,
  `./tools/wrangler.toml`,
]);

console.log('wrangler deploy:');
for await (const line of deployCommand) {
  console.log(line);
}

// Note: this approach works fine for the preview environment, but it wouldn’t
// work for the production environment, since there would be some time before
// all the necessary secrets are available.

console.log();
console.log(`Adding secrets...`);

const secretsJSON = await decryptFile(
  path.resolve(`./tools/cloudflare/secrets.production.json`),
  {key: process.env.SECRETS_ENCRYPTION_KEY!},
);

const secrets = new Map(Object.entries(secretsJSON));

for (const [name, value] of secrets) {
  const result =
    await cloudflare.workersForPlatforms.dispatch.namespaces.scripts.secrets.update(
      dispatchNamespace,
      dispatchName,
      {
        account_id: process.env.CLOUDFLARE_ACCOUNT_ID!,
        name,
        text: value,
        type: 'secret_text',
      },
    );

  console.log();
  console.log(`Secret updated: ${name}`);
  console.log(result);
}
