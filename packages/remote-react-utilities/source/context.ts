import {createContext} from 'react';
import type {RemoteRoot} from '@remote-ui/core';

export const RemoteRootContext = createContext<RemoteRoot | null>(null);
