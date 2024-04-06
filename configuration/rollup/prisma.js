import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {createHash} from 'node:crypto';

export function prismaFromEdge() {
  return [wasm()];
}

// To use Prisma on Workers without their data proxy, I need to use the .wasm version
// of the Prisma client. Cloudflare wants .wasm files to be imported directly in the worker
// script, with a proper relative path, which it then automatically turns into a `WebAssembly.Module`.
// This plugin copies `.wasm` imports, adds a hash for consistency, and replaces the import
// for that file with the new, hashed path.
//
// @see https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/
// @see https://developers.cloudflare.com/workers/wrangler/bundling/
// @see https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface
// @see https://github.com/rollup/plugins/blob/master/packages/wasm/src/index.ts
function wasm(options = {}) {
  const {fileName = '[name].[hash][extname]'} = options;

  const copies = new Map();

  return {
    name: 'wasm',

    async resolveId(id, importer) {
      if (!/\.wasm$/.test(id)) {
        return null;
      }

      const resolved = await this.resolve(id, importer, {skipSelf: true});

      if (!resolved) {
        return null;
      }

      const file = resolved.id;

      const existingCopy = copies.get(file);
      if (existingCopy) {
        return {
          id: `./${existingCopy.filename}`,
          external: true,
        };
      }

      const content = await fs.readFile(file);
      const extension = path.extname(file);
      const name = path.basename(file, extension);

      const hash = createHash('sha1')
        .update(content)
        .digest('hex')
        .substring(0, 8);

      const outputFileName = fileName
        .replace(/\[hash\]/g, hash)
        .replace(/\[ext\]/g, extension.slice(1))
        .replace(/\[extname\]/g, extension)
        .replace(/\[name\]/g, name);

      this.addWatchFile(file);

      copies.set(file, {
        filename: outputFileName,
        content,
      });

      return {
        id: `./${outputFileName}`,
        external: true,
      };
    },
    generateBundle: async function write() {
      await Promise.all(
        [...copies.values()].map(({filename, content}) => {
          this.emitFile({
            type: 'asset',
            source: content,
            name: 'Rollup WASM Asset',
            fileName: filename,
          });
        }),
      );
    },
  };
}

export default wasm;
