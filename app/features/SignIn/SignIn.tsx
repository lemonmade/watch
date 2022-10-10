import {useEffect, useMemo, useState} from 'react';
import {useRoutes, useNavigate, useCurrentUrl, Link} from '@quilted/quilt';
import {
  View,
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
  Banner,
  Action,
} from '@lemon/zest';
import {useComputed, useSignal} from '@watching/react-signals';

import {SignInErrorReason} from '~/global/auth';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github';
import {useMutation} from '~/shared/graphql';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';
import startWebAuthnSignInMutation from './graphql/StartWebAuthnSignInMutation.graphql';
import completeWebAuthnSignInMutation from './graphql/CompleteWebAuthnSignInMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  RedirectTo = 'redirect',
}

export default function SignIn() {
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
    <BlockStack spacing padding>
      <Heading>Sign in</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <SignInWithEmail />

      <TextBlock>or...</TextBlock>

      <SignInWithWebAuthn />

      <TextBlock>or...</TextBlock>

      <SignInWithGithub onError={setReason} />
    </BlockStack>
  );
}

function SignInWithEmail() {
  const email = useSignal('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signInWithEmail = useMutation(signInWithEmailMutation);

  return (
    <Form
      onSubmit={() => {
        signInWithEmail.mutate(
          {
            email: email.value,
            redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
          },
          {
            onSuccess() {
              navigate('check-your-email');
            },
          },
        );
      }}
    >
      <TextField label="Email" value={email} />
    </Form>
  );
}

function SignInWithWebAuthn() {
  const navigate = useNavigate();
  const startWebAuthnSignIn = useMutation(startWebAuthnSignInMutation);
  const completeWebAuthnSignIn = useMutation(completeWebAuthnSignInMutation);

  const email = useSignal('');
  const disabled = useComputed(() => email.value.trim().length === 0);

  const {authenticate, authenticateForAutocomplete} = useMemo(() => {
    return {authenticate, authenticateForAutocomplete};

    async function authenticate({email}: {email?: string} = {}) {
      const [{startAuthentication}, options] = await Promise.all([
        import('@simplewebauthn/browser'),
        startWebAuthnSignIn.mutateAsync({
          email,
        }),
      ]);

      const authenticationResult = await startAuthentication(
        JSON.parse(options.startWebAuthnSignIn.result),
      );

      const result = await completeWebAuthnSignIn.mutateAsync({
        credential: JSON.stringify(authenticationResult),
      });

      if (result.completeWebAuthnSignIn.user?.id) {
        navigate(
          (currentUrl) =>
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? '/app',
        );
      }
    }

    async function authenticateForAutocomplete() {
      const {browserSupportsWebAuthnAutofill} = await import(
        '@simplewebauthn/browser'
      );

      if (!(await browserSupportsWebAuthnAutofill())) return;

      try {
        await authenticate();
      } catch {
        // intentional noop
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    authenticateForAutocomplete();
  }, [authenticateForAutocomplete]);

  return (
    <Form
      onSubmit={async () => {
        await authenticate({email: email.value});
      }}
    >
      <BlockStack spacing>
        <TextField
          label="Email"
          value={email}
          changeTiming="input"
          autocomplete="webauthn username"
        />
        <Action perform="submit" disabled={disabled}>
          Sign in with WebAuthn
        </Action>
      </BlockStack>
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

  const open = useGithubOAuthModal(GithubOAuthFlow.SignIn, (event) => {
    if (event.success) {
      navigate(event.redirectTo, {replace: true});
    } else {
      onError(event.reason ?? SignInErrorReason.Generic);
    }
  });

  return (
    <Action
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
        });
      }}
    >
      Sign in with Github
    </Action>
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
