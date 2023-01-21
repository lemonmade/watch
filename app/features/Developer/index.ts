import {createAsyncComponent} from '@quilted/quilt';

export const AccessTokens = createAsyncComponent(
  () => import('./AccessTokens/AccessTokens'),
);

export const Apps = createAsyncComponent(() => import('./Apps/Apps'));

export const AuthenticateCli = createAsyncComponent(
  () => import('./AuthenticateCli/AuthenticateCli'),
);

export const CreatedAccountFromCli = createAsyncComponent(
  () => import('./CreatedAccountFromCli/CreatedAccountFromCli'),
);

export const Console = createAsyncComponent(() => import('./Console/Console'));

export const Developer = createAsyncComponent(() => import('./Developer'));
