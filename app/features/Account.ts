import {AsyncComponent} from '@quilted/quilt/async';

export const Account = AsyncComponent.from(
  () => import('./Account/Account.tsx'),
);

export const CheckYourEmail = AsyncComponent.from(
  () => import('./Account/CheckYourEmail.tsx'),
);

export const CreateAccount = AsyncComponent.from(
  () => import('./Account/CreateAccount.tsx'),
);

export const Goodbye = AsyncComponent.from(
  () => import('./Account/Goodbye.tsx'),
);

export const Payment = AsyncComponent.from(
  () => import('./Account/Payment.tsx'),
);
