import {createUseAppContextHook} from '~/shared/context';

export interface User {
  readonly id: string;
}

declare module '~/shared/context' {
  interface AppContext {
    readonly user?: User;
  }
}

export const useUser = createUseAppContextHook(({user}) => user);
