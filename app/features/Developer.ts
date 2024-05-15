import {AsyncComponent} from '@quilted/quilt/async';

export const AccessTokens = AsyncComponent.from(
  () => import('./Developer/AccessTokens/AccessTokens.tsx'),
);

export const Apps = AsyncComponent.from(
  () => import('./Developer/Apps/Apps.tsx'),
);

export const AuthenticateCli = AsyncComponent.from(
  () => import('./Developer/AuthenticateCli/AuthenticateCli.tsx'),
);

export const CreatedAccountFromCli = AsyncComponent.from(
  () => import('./Developer/CreatedAccountFromCli/CreatedAccountFromCli.tsx'),
);

export const Console = AsyncComponent.from(
  () => import('./Developer/Console/Console.tsx'),
);

export const Developer = AsyncComponent.from(
  () => import('./Developer/Developer.tsx'),
);
