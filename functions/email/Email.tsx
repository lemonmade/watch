import {Welcome} from './emails/Welcome';
import {SignIn} from './emails/SignIn';

import type {EmailType, PropsForEmail} from './types';

interface Props<T extends EmailType> {
  type: T;
  props: PropsForEmail<T>;
}

export function Email<T extends EmailType>({type, props}: Props<T>) {
  switch (type) {
    case 'welcome': {
      return <Welcome {...(props as PropsForEmail<'welcome'>)} />;
    }
    case 'signIn': {
      return <SignIn {...(props as PropsForEmail<'signIn'>)} />;
    }
  }

  throw new Error(`No email found for type ${type}`);
}
