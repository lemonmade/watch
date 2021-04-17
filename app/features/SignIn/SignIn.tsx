import {useState} from 'react';
import {
  useMutation,
  useRoutes,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
import {
  Link,
  View,
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
  Banner,
  Button,
} from '@lemon/zest';

import {SignInErrorReason} from 'global/utilities/auth';
import {GithubOAuthModal} from 'components';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  RedirectTo = 'redirect',
}

export function SignIn() {
  return useRoutes([
    {match: '/', render: () => <SignInForm />},
    {match: 'check-your-email', render: () => <CheckYourEmail />},
  ]);
}

function SignInForm() {
  const currentUrl = useCurrentUrl();

  const [reason, setReason] = useState<SignInErrorReason | undefined>(
    (currentUrl.searchParams.get(SearchParam.Reason) as any) ?? undefined,
  );

  return (
    <BlockStack padding="base">
      <Heading>Sign in</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <SignInWithEmail />

      <TextBlock>or...</TextBlock>

      <SignInWithGithub onError={setReason} />
    </BlockStack>
  );
}

function SignInWithEmail() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signInWithEmail = useMutation(signInWithEmailMutation);

  return (
    <Form
      onSubmit={async () => {
        await signInWithEmail({
          variables: {
            email,
            redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
          },
        });
        navigate('check-your-email');
      }}
    >
      <TextField label="Email" onChange={(value) => setEmail(value)} />
    </Form>
  );
}

function SignInWithGithub({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const [open, setOpen] = useState<false | URL>(false);

  return (
    <>
      <GithubOAuthModal
        type="signIn"
        open={open}
        onEvent={(event, modal) => {
          modal.close();

          if (event.success) {
            navigate(event.redirectTo);
          } else {
            onError(event.reason ?? SignInErrorReason.Generic);
          }
        }}
      />
      <Button
        onPress={() => {
          const targetUrl = new URL(
            '/internal/auth/github/sign-in',
            currentUrl,
          );

          const redirectTo = currentUrl.searchParams.get(
            SearchParam.RedirectTo,
          );

          if (redirectTo) {
            targetUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
          }

          setOpen(targetUrl);
        }}
      >
        Sign in with Github
      </Button>
    </>
  );
}

function ErrorBanner({reason}: {reason: SignInErrorReason}) {
  switch (reason) {
    case SignInErrorReason.GithubNoAccount: {
      return (
        <Banner status="error">
          You authenticated with Github, but no account is linked with your
          Github profile. You’ll need to sign in with email, then connect Github
          from the <Link to="/app/me">account page</Link>.
        </Banner>
      );
    }
    case SignInErrorReason.GithubError: {
      return (
        <Banner status="error">
          There was an error while trying to sign in with Github. You can try
          again, or sign in with your email instead. Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case SignInErrorReason.Expired: {
      return (
        <Banner status="error">
          Your temporary sign in token expired, so you’ll need to sign in again.
          Sorry for the inconvenience!
        </Banner>
      );
    }
    default: {
      return (
        <Banner status="error">
          Something went wrong while trying to sign you in, so you’ll need to
          try again. Sorry for the inconvenience!
        </Banner>
      );
    }
  }
}

function CheckYourEmail() {
  return (
    <View padding="base">
      <TextBlock>Check your email!</TextBlock>
    </View>
  );
}
