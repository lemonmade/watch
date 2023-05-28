import {extensionRollupConfiguration} from '@watching/tools/rollup';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';

export default extensionRollupConfiguration(import.meta.url, {
  plugins: [
    svelte({
      emitCss: false,
      preprocess: sveltePreprocess(),
    }),
  ],
});
