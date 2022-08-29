import {createContext} from 'react';
import {type AnyApi, type WithThreadSignals} from '@watching/clips';

export const ApiContext = createContext<WithThreadSignals<AnyApi> | null>(null);
