import {
  useSubject,
  useSender,
  useSendTo,
  usePlainTextContent,
} from '@quilted/react-email';

interface Props {
  userEmail: string;
}

export function SubscriptionConfirmation({userEmail}: Props) {
  useSubject('Thanks for subscribing!');
  useSender({name: 'Subscription Bot', email: 'hello@lemon.tools'});
  useSendTo(userEmail);

  const url = new URL('https://watch.lemon.tools/app');

  usePlainTextContent(() => `Get started by clicking here: ${url.href}.`);

  return (
    <p>
      Get started by <a href={url.href}>clicking here.</a>
    </p>
  );
}
