import {createUseAppContextHook} from '~/shared/context.ts';

export interface User {
  readonly id: string;
}

declare module '~/shared/context.ts' {
  interface AppContext {
    readonly user?: User;
  }
}

export const useUser = createUseAppContextHook(({user}) => user);
