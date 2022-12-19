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

export function SignIn({token, userEmail}: Props) {
  useSubject('Sign in to Watch');
  useSender({name: 'Sign in Bot', email: 'accounts@lemon.tools'});
  useSendTo(userEmail);

  const url = new URL('https://watch.lemon.tools/internal/auth/email/sign-in');
  url.searchParams.set('token', token);

  usePlainTextContent(() => `Sign in by clicking this link: ${url.href}.`);

  return (
    <p>
      Sign in by <a href={url.href}>clicking here.</a>
    </p>
  );
}
