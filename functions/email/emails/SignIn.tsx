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

export function SignIn({token, userEmail}: Props) {
  useSubject('Sign in to Watch');
  useSender({name: 'Sign in Bot', email: 'accounts@lemon.tools'});
  useSendTo(userEmail);

  const url = `https://watch.lemon.tools/internal/auth/email/sign-in?token=${token}`;

  usePlainTextEmail(() => `Sign in by clicking this link: ${url}.`);

  return (
    <p>
      Sign in by <a href={url}>clicking here.</a>
    </p>
  );
}
