import {createAsyncComponent} from '@quilted/quilt';

export const Account = createAsyncComponent(
  () => import('./Account/Account.tsx'),
);

export const CheckYourEmail = createAsyncComponent(
  () => import('./Account/CheckYourEmail.tsx'),
);

export const CreateAccount = createAsyncComponent(
  () => import('./Account/CreateAccount.tsx'),
);

export const Goodbye = createAsyncComponent(
  () => import('./Account/Goodbye.tsx'),
);

export const Payment = createAsyncComponent(
  () => import('./Account/Payment.tsx'),
);
