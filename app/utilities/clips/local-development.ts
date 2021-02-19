import {createContext, useContext} from 'react';
import type {Version, ExtensionPoint} from '@watching/clips';

export interface Extension {
  readonly version: Version;
  readonly script: string;
  readonly socketUrl?: string;
}

export const LocalDevelopmentClipsContext = createContext<readonly Extension[]>(
  [],
);

export function useLocalDevelopmentClips<T extends ExtensionPoint>(
  _extensionPoint: T,
) {
  return useContext(LocalDevelopmentClipsContext);
}
