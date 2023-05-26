import {useEffect, useMemo, useState} from 'react';
import {
  useRoutes,
  useNavigate,
  useCurrentUrl,
  useComputed,
  useSignal,
  Link,
  useRouter,
  usePerformanceNavigation,
} from '@quilted/quilt';
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

import {SignInErrorReason} from '~/global/auth.ts';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github.ts';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google.ts';
import {useMutation} from '~/shared/graphql.ts';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';
import startPasskeySignInMutation from './graphql/StartPasskeySignInMutation.graphql';
import finishPasskeySignInMutation from './graphql/FinishPasskeySignInMutation.graphql';

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
  usePerformanceNavigation({state: 'complete'});

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

      <SignInWithGithub onError={setReason} />
      <SignInWithGoogle onError={setReason} />
    </BlockStack>
  );
}

function SignInWithEmail() {
  const email = useSignal('');
  const disabled = useComputed(() => email.value.trim().length === 0);

  const signInWithPasskey = useSignInWithPasskey();
  const signInWithEmail = useSignInWithEmail();

  return (
    <Form
      onSubmit={async () => {
        await signInWithPasskey({email: email.value});
      }}
    >
      <BlockStack spacing>
        <TextField
          label="Email"
          value={email}
          keyboardType="email"
          changeTiming="input"
          autocomplete="webauthn username"
        />
        <Action
          disabled={disabled}
          onPress={async () => {
            await signInWithEmail({email: email.value});
          }}
        >
          Sign in email
        </Action>
        <Action perform="submit" disabled={disabled}>
          Sign in with Passkey
        </Action>
      </BlockStack>
    </Form>
  );
}

function useSignInWithPasskey() {
  const router = useRouter();
  const startPasskeySignIn = useMutation(startPasskeySignInMutation);
  const finishPasskeySignIn = useMutation(finishPasskeySignInMutation);

  const {signInWithPasskey, prepareBrowserAutocomplete} = useMemo(() => {
    return {signInWithPasskey, prepareBrowserAutocomplete};

    async function signInWithPasskey({
      email,
      browserAutocomplete = false,
    }: {email?: string; browserAutocomplete?: boolean} = {}) {
      const [{startAuthentication}, options] = await Promise.all([
        import('@simplewebauthn/browser'),
        startPasskeySignIn.mutateAsync({
          email,
        }),
      ]);

      const authenticationResult = await startAuthentication(
        JSON.parse(options.startPasskeySignIn.result),
        browserAutocomplete,
      );

      const result = await finishPasskeySignIn.mutateAsync({
        credential: JSON.stringify(authenticationResult),
      });

      if (result.finishPasskeySignIn.user?.id) {
        const {url} = router.resolve(
          (currentUrl) =>
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? '/app',
        );

        window.location.replace(url.href);
      }
    }

    async function prepareBrowserAutocomplete() {
      const {browserSupportsWebAuthnAutofill} = await import(
        '@simplewebauthn/browser'
      );

      if (!(await browserSupportsWebAuthnAutofill())) return;

      try {
        await signInWithPasskey({browserAutocomplete: true});
      } catch {
        // intentional noop
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    prepareBrowserAutocomplete();
  }, [prepareBrowserAutocomplete]);

  return signInWithPasskey;
}

function useSignInWithEmail() {
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signInWithEmail = useMutation(signInWithEmailMutation);

  return async function doSignInWithEmail({email}: {email: string}) {
    await signInWithEmail.mutateAsync(
      {
        email,
        redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
      },
      {
        onSuccess() {
          navigate('check-your-email');
        },
      },
    );
  };
}

function SignInWithGithub({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const currentUrl = useCurrentUrl();

  const open = useGithubOAuthModal(GithubOAuthFlow.SignIn, (event) => {
    if (event.success) {
      // TODO: update app context with new user
      window.location.replace(event.redirectTo);
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

function SignInWithGoogle({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const currentUrl = useCurrentUrl();

  const open = useGoogleOAuthModal(GoogleOAuthFlow.SignIn, (event) => {
    if (event.success) {
      // TODO: update app context with new user
      window.location.replace(event.redirectTo);
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
      Sign in with Google
    </Action>
  );
}

function ErrorBanner({reason}: {reason: SignInErrorReason}) {
  switch (reason) {
    case SignInErrorReason.GithubNoAccount: {
      return (
        <Banner tone="critical">
          You authenticated with Github, but no account is linked with your
          Github profile. You’ll need to sign in with email, then connect Github
          from the <Link to="/app/me">account page</Link>.
        </Banner>
      );
    }
    case SignInErrorReason.GithubError: {
      return (
        <Banner tone="critical">
          There was an error while trying to sign in with Github. You can try
          again, or sign in with your email instead. Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case SignInErrorReason.GoogleNoAccount: {
      return (
        <Banner tone="critical">
          You authenticated with Google, but no account is linked with your
          Google profile. You’ll need to sign in with email, then connect Google
          from the <Link to="/app/me">account page</Link>.
        </Banner>
      );
    }
    case SignInErrorReason.GoogleError: {
      return (
        <Banner tone="critical">
          There was an error while trying to sign in with Google. You can try
          again, or sign in with your email instead. Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case SignInErrorReason.Expired: {
      return (
        <Banner tone="critical">
          Your temporary sign in token expired, so you’ll need to sign in again.
          Sorry for the inconvenience!
        </Banner>
      );
    }
    default: {
      return (
        <Banner tone="critical">
          Something went wrong while trying to sign you in, so you’ll need to
          try again. Sorry for the inconvenience!
        </Banner>
      );
    }
  }
}

function CheckYourEmail() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <View padding="base">
      <TextBlock>Check your email!</TextBlock>
    </View>
  );
}
