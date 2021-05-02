import {createAsyncComponent} from '@quilted/quilt';

export const SignIn = createAsyncComponent({
  load: () => import('./SignIn'),
});
