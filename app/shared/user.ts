import {useAppContext} from '~/shared/context.ts';
import type {UserRole} from '~/graphql/types.ts';

export interface User {
  readonly id: string;
  readonly role: UserRole;
}

declare module '~/shared/context.ts' {
  interface AppContext {
    readonly user?: User;
  }
}

export function useUser() {
  const {user} = useAppContext();

  if (user == null) {
    throw new Error('User not logged in!');
  }

  return user;
}
