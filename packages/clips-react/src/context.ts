import {createContext} from 'react';
import type {AnyApi} from '@watching/clips';

export const ApiContext = createContext<AnyApi | null>(null);
