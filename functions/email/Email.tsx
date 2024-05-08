import {type ComponentProps} from 'preact';

import {Welcome} from './emails/Welcome.tsx';
import {SignIn} from './emails/SignIn.tsx';
import {SubscriptionConfirmation} from './emails/SubscriptionConfirmation.tsx';
import {SubscriptionCancellation} from './emails/SubscriptionCancellation.tsx';

interface Props<T extends EmailType> {
  type: T;
  props: PropsForEmail<T>;
}

export const EMAILS = {
  welcome: Welcome,
  signIn: SignIn,
  subscriptionConfirmation: SubscriptionConfirmation,
  subscriptionCancellation: SubscriptionCancellation,
};

export type EmailPropsMap = {
  [Email in keyof typeof EMAILS]: ComponentProps<(typeof EMAILS)[Email]>;
};

export type EmailType = keyof EmailPropsMap;

export type PropsForEmail<T extends EmailType> = EmailPropsMap[T];

export function Email<Email extends EmailType>({type, props}: Props<Email>) {
  const EmailComponent = EMAILS[type] as any;

  if (EmailComponent == null) {
    throw new Error(`No email found for type ${type}`);
  }

  return <EmailComponent {...props} />;
}
