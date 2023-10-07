import {createAsyncComponent} from '@quilted/quilt/async';

export const AccessTokens = createAsyncComponent(
  () => import('./Developer/AccessTokens/AccessTokens.tsx'),
);

export const Apps = createAsyncComponent(
  () => import('./Developer/Apps/Apps.tsx'),
);

export const AuthenticateCli = createAsyncComponent(
  () => import('./Developer/AuthenticateCli/AuthenticateCli.tsx'),
);

export const CreatedAccountFromCli = createAsyncComponent(
  () => import('./Developer/CreatedAccountFromCli/CreatedAccountFromCli.tsx'),
);

export const Console = createAsyncComponent(
  () => import('./Developer/Console/Console.tsx'),
);

export const Developer = createAsyncComponent(
  () => import('./Developer/Developer.tsx'),
);
