import {type ExtensionPoint} from '@watching/clips';
import {type Signal} from '@watching/thread-signals';

import {useApi} from './api';
import {useSignalValue} from './signals';

export function useSettings<
  Configuration extends Record<string, unknown> = Record<string, unknown>,
>() {
  return useSignalValue(
    useApi<ExtensionPoint>().settings as Signal<Configuration>,
  );
}
