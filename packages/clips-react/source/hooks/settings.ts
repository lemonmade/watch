import type {ExtensionPoint} from '@watching/clips';

import {useApi} from './api';
import {useSubscription} from './subscription';
import type {StatefulRemoteSubscribable} from './subscription';

export function useSettings<
  Configuration extends Record<string, unknown> = Record<string, unknown>,
>() {
  return useSubscription(
    useApi<ExtensionPoint>()
      .settings as StatefulRemoteSubscribable<Configuration>,
  );
}
