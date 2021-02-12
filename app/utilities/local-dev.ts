import {createContext, useContext} from 'react';
import type {Version, ExtensionPoint} from '@watching/clips';

export interface Extension {
  readonly version: Version;
  readonly script: string;
  readonly socketUrl?: string;
}

export const LocalDevExtensionsContext = createContext<readonly Extension[]>(
  [],
);

export function useLocalDevExtensionsContext<T extends ExtensionPoint>(
  extensionPoint: T,
) {
  return useContext(LocalDevExtensionsContext);
}
