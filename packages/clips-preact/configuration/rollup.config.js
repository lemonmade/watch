import {quiltPackage} from '@quilted/rollup/package';
import nameCache from './terser/name-cache.json' with {type: 'json'};

export default quiltPackage({
  customize: {
    plugins: [
      {
        // @see https://github.com/preactjs/preact/blob/master/mangle.json
        name: '@quilted/preact-mini-compat/terser',
        async renderChunk(code, chunk) {
          if (
            !chunk.fileName.endsWith('.mjs') &&
            !chunk.fileName.endsWith('.esnext')
          ) {
            return null;
          }

          const {minify} = await import('terser');

          const {code: minifiedCode} = await minify(code, {
            nameCache,
            mangle: {
              reserved: ['useSignal', 'useComputed', 'useSignalEffect'],
              keep_classnames: true,
              properties: {
                regex: '^_[^_]',
                reserved: [
                  '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
                  '__REACT_DEVTOOLS_GLOBAL_HOOK__',
                  '__PREACT_DEVTOOLS__',
                  '_renderers',
                  '_',
                ],
              },
            },
            compress: {
              conditionals: false,
              loops: false,
              sequences: false,
            },
            ecma: 2017,
            toplevel: true,
            module: true,
          });

          return minifiedCode;
        },
      },
    ],
  },
});
