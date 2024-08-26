import {AsyncComponent} from '@quilted/quilt/async';

export const SignIn = AsyncComponent.from(
  () => import('./Authentication/SignIn.tsx'),
);

export const SignedOut = AsyncComponent.from(
  () => import('./Authentication/SignedOut.tsx'),
);
