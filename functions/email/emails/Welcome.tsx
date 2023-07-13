import {
  useSubject,
  useSender,
  useSendTo,
  usePlainTextContent,
} from '@quilted/react-email';

interface Props {
  token: string;
  userEmail: string;
}

export function Welcome({token, userEmail}: Props) {
  useSubject('Welcome to Watch!');
  useSender({name: 'Welcome Bot', email: 'hello@lemon.tools'});
  useSendTo(userEmail);

  const url = new URL(
    'https://watch.lemon.tools/internal/auth/email/create-account',
  );
  url.searchParams.set('token', token);

  usePlainTextContent(
    () =>
      `Welcome! Finish setting up your account by clicking this link: ${url.href}`,
  );

  return (
    <p>
      Welcome! Finish setting up your account by{' '}
      <a href={url.href}>clicking here.</a>
    </p>
  );
}
