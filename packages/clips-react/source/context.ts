import {createContext} from 'react';
import {
  type ExtensionPoint,
  type Api,
  type Signal,
  type WithThreadSignals,
} from '@watching/clips';

export {type WithThreadSignals, type Signal};

export const ApiContext = createContext<WithThreadSignals<
  Api<ExtensionPoint>
> | null>(null);
