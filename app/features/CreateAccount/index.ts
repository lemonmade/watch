import {createAsyncComponent} from '@quilted/quilt';

export const CreateAccount = createAsyncComponent(
  () => import('./CreateAccount'),
);

export const CheckYourEmail = createAsyncComponent(
  () => import('./CheckYourEmail'),
);
