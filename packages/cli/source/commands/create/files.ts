import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';
import {fileURLToPath} from 'url';
import type {BuiltInParserName} from 'prettier';

export {prompt} from './prompts';

export type TemplateName = 'SeriesAccessory';
export type TemplateFormat = 'react' | 'dom' | 'core';

export function loadTemplate(name: TemplateName, format: TemplateFormat) {
  let templateRootPromise: Promise<string> | undefined;

  return {
    async copy(
      to: string,
      {
        handleFile,
      }: {
        handleFile?(
          file: string,
          read: () => Promise<string>,
        ): boolean | string | Promise<boolean | string>;
      } = {},
    ) {
      templateRootPromise ??= templateDirectory(name, format);
      const templateRoot = await templateRootPromise;
      const targetRoot = path.resolve(to);

      const files = glob.sync('**/*', {
        cwd: templateRoot,
        absolute: false,
      });

      await Promise.all(
        files.map(async (file) => {
          const read = () =>
            fs.promises.readFile(path.resolve(templateRoot, file), 'utf-8');
          const content = await handleFile?.(file, read);

          if (!content) return;

          const targetPath = path.join(
            targetRoot,
            file.startsWith('_') ? `.${file.slice(1)}` : file,
          );

          const resolvedContent =
            typeof content === 'string' ? content : await read();

          await fs.promises.mkdir(path.dirname(targetPath), {recursive: true});
          await fs.promises.writeFile(targetPath, resolvedContent);
        }),
      );
    },
    async read(file: string) {
      templateRootPromise ??= templateDirectory(name, format);
      const templateRoot = await templateRootPromise;

      return fs.readFileSync(path.join(templateRoot, file), {encoding: 'utf8'});
    },
  };
}

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
      await writeFile(path.resolve(resolvedTarget, file), content);
    },
  };
}

let packageRootPromise: Promise<string> | undefined;

async function templateDirectory(name: TemplateName, format: TemplateFormat) {
  return path.join(await getPackageRoot(), 'templates', name, format);
}

async function getPackageRoot(): Promise<string> {
  if (!packageRootPromise) {
    packageRootPromise = (async () => {
      const {packageDirectory} = await import('pkg-dir');

      return packageDirectory({
        cwd: path.dirname(fileURLToPath(import.meta.url)),
      });
    })();
  }

  return packageRootPromise;
}

function copy(source: string, destination: string) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    copyDirectory(source, destination);
  } else {
    fs.copyFileSync(source, destination);
  }
}

async function copyDirectory(source: string, destination: string) {
  fs.mkdirSync(destination, {recursive: true});
  for (const file of fs.readdirSync(source)) {
    const srcFile = path.resolve(source, file);
    const destFile = path.resolve(destination, file);
    copy(srcFile, destFile);
  }
}

export async function writeFile(file: string, content: string) {
  await fs.promises.writeFile(file, content);
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
