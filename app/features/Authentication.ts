import {createAsyncComponent} from '@quilted/quilt';

export const SignIn = createAsyncComponent(
  () => import('./Authentication/SignIn.tsx'),
);

export const SignedOut = createAsyncComponent(
  () => import('./Authentication/SignedOut.tsx'),
);
