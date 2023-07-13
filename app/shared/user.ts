import {createUseAppContextHook} from '~/shared/context.ts';
import type {UserRole} from '~/graphql/types';

export interface User {
  readonly id: string;
  readonly role: UserRole;
}

declare module '~/shared/context.ts' {
  interface AppContext {
    readonly user?: User;
  }
}

export const useUser = createUseAppContextHook(({user}) => user);
