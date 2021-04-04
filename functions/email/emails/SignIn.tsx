import {
  useSubject,
  useSender,
  useSendTo,
  usePlainTextEmail,
} from '@lemon/react-email';

interface Props {
  token: string;
  userEmail: string;
  redirectTo?: string;
}

export function SignIn({token, userEmail, redirectTo}: Props) {
  useSubject('Sign in to Watch');
  useSender({name: 'Sign in Bot', email: 'accounts@lemon.tools'});
  useSendTo(userEmail);

  const url = new URL('https://watch.lemon.tools/internal/auth/email/sign-in');
  url.searchParams.set('token', token);

  if (redirectTo) {
    if (new URL(redirectTo, url.origin).origin === url.origin) {
      url.searchParams.set('redirect', redirectTo);
    }
  }

  usePlainTextEmail(() => `Sign in by clicking this link: ${url.href}.`);

  return (
    <p>
      Sign in by <a href={url.href}>clicking here.</a>
    </p>
  );
}
