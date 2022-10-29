import {createContext} from 'react';
import {
  type AnyApi,
  type Signal,
  type WithThreadSignals,
} from '@watching/clips';

export {type WithThreadSignals, type Signal};

export const ApiContext = createContext<WithThreadSignals<AnyApi> | null>(null);
