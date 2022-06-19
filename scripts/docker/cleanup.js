import {execSync} from 'child_process';
import {readdir} from 'fs/promises';

run();

async function run() {
  const target = process.argv[2];
  const dryRun = process.argv.some((arg) => arg === '--dry-run');

  const directoryLists = await Promise.all([
    readdir('.').then((files) =>
      files.filter(
        (file) =>
          file !== 'node_modules' &&
          file !== 'functions' &&
          file !== 'package.json' &&
          !file.startsWith('pnpm-'),
      ),
    ),
    readdir('functions').then((files) =>
      files.map((file) => `functions/${file}`),
    ),
  ]);

  const targetDirectory = ignoreForTarget(target);

  const matches = directoryLists
    .flat()
    .filter((match) => match !== targetDirectory);

  if (dryRun) {
    console.log(`Would remove ${matches.length} files`);
    console.log(matches);
    return;
  }

  console.log(`Removing ${matches.length} files`);
  console.log(matches);

  execSync(`rm -rf ${matches.join(' ')}`, {
    stdio: 'inherit',
  });
}

function ignoreForTarget(target) {
  if (target === 'app') return 'app';
  return `functions/${target}`;
}
