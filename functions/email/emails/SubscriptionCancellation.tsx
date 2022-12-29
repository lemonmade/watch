import {
  useSubject,
  useSender,
  useSendTo,
  usePlainTextContent,
} from '@quilted/react-email';

interface Props {
  userEmail: string;
}

export function SubscriptionCancellation({userEmail}: Props) {
  useSubject('Your subscription has been cancelled');
  useSender({name: 'Subscription Bot', email: 'accounts@lemon.tools'});
  useSendTo(userEmail);

  usePlainTextContent(() => `Thanks for being a subscriber!`);

  return <p>Thanks for being a subscriber!</p>;
}
