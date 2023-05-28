import '@watching/clips/elements';
import {extension} from '@watching/clips-svelte';

import WatchThroughAccessory from './WatchThroughAccessory.svelte';

export default extension((_api, options) => {
  return new WatchThroughAccessory(options);
});
