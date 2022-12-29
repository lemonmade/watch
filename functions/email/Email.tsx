import {type ComponentProps} from 'react';

import {Welcome} from './emails/Welcome';
import {SignIn} from './emails/SignIn';
import {SubscriptionConfirmation} from './emails/SubscriptionConfirmation';
import {SubscriptionCancellation} from './emails/SubscriptionCancellation';

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
  [Email in keyof typeof EMAILS]: ComponentProps<typeof EMAILS[Email]>;
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
