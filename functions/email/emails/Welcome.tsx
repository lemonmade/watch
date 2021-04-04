import {
  useSubject,
  useSender,
  useSendTo,
  usePlainTextEmail,
} from '@lemon/react-email';

interface Props {
  token: string;
  userEmail: string;
}

export function Welcome({token, userEmail}: Props) {
  useSubject('Welcome to Watch!');
  useSender({name: 'Welcome Bot', email: 'welcome@lemon.tools'});
  useSendTo(userEmail);

  const url = new URL('https://watch.lemon.tools/internal/auth/email/sign-up');
  url.searchParams.set('token', token);

  usePlainTextEmail(
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
