import type {ExtensionPoint} from '@watching/clips';

import {useApi} from './api';
import {useSubscription} from './subscription';
import type {StatefulRemoteSubscribable} from './subscription';

export function useConfiguration<
  Configuration extends Record<string, unknown> = Record<string, unknown>
>() {
  return useSubscription(
    useApi<ExtensionPoint>()
      .configuration as StatefulRemoteSubscribable<Configuration>,
  );
}
