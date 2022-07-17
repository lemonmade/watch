import {createUseContextHook} from '@quilted/react-utilities';
import {RemoteRootContext} from './context';

export const useRemoteRoot = createUseContextHook(RemoteRootContext);
