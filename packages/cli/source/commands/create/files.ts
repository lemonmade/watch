import * as fs from 'fs';
import * as path from 'path';
import type {BuiltInParserName} from 'prettier';
export {prompt} from '@quilted/cli-kit';

export interface OutputTarget {
  readonly root: string;
  read(file: string): Promise<string>;
  write(file: string, content: string): Promise<void>;
}

export function createOutputTarget(target: string): OutputTarget {
  const resolvedTarget = path.resolve(target);

  return {
    root: resolvedTarget,
    read(file: string) {
      return fs.promises.readFile(path.resolve(resolvedTarget, file), {
        encoding: 'utf8',
      });
    },
    async write(file: string, content: string) {
      await fs.promises.writeFile(path.resolve(resolvedTarget, file), content);
    },
  };
}

export async function isEmpty(path: string) {
  if (!fs.existsSync(path)) {
    return true;
  }

  return fs.readdirSync(path).length === 0;
}

export async function emptyDirectory(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const file of fs.readdirSync(dir)) {
    fs.rmSync(path.resolve(dir, file), {force: true, recursive: true});
  }
}

export function relativeDirectoryForDisplay(relativeDirectory: string) {
  return relativeDirectory.startsWith('.')
    ? relativeDirectory
    : `.${path.sep}${relativeDirectory}`;
}

export async function format(
  content: string,
  {as: parser}: {as: BuiltInParserName},
) {
  try {
    const [{format}, {default: babel}, {default: typescript}, {default: yaml}] =
      await Promise.all([
        import('prettier/standalone'),
        import('prettier/parser-babel'),
        import('prettier/parser-typescript'),
        import('prettier/parser-yaml'),
      ]);

    return format(content, {
      arrowParens: 'always',
      bracketSpacing: false,
      singleQuote: true,
      trailingComma: 'all',
      parser,
      plugins: [babel, typescript, yaml],
    });
  } catch {
    // intentional noop
  }
}

export function mergeDependencies(
  first: Record<string, string> = {},
  second: Record<string, string> = {},
) {
  const all = {...first, ...second};
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries(all).sort(([keyOne], [keyTwo]) =>
    keyOne.localeCompare(keyTwo),
  )) {
    merged[key] = value;
  }

  return merged;
}
