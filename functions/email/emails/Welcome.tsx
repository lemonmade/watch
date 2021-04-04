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

  const url = `https://watch.lemon.tools/internal/sign-up?token=${token}`;

  usePlainTextEmail(
    () =>
      `Welcome! Finish setting up your account by clicking this link: ${url}`,
  );

  return (
    <p>
      Welcome! Finish setting up your account by{' '}
      <a href={url}>clicking here.</a>
    </p>
  );
}
