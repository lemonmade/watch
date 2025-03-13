import {useEffect, useMemo, useState} from 'preact/hooks';
import {useSignal, useComputed} from '@quilted/quilt/signals';
import {
  Link,
  useRouter,
  useRoutes,
  useNavigate,
  useCurrentURL,
} from '@quilted/quilt/navigation';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  View,
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
  Banner,
  Button,
} from '@lemon/zest';

import {SignInErrorReason} from '~/global/auth.ts';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github.ts';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google.ts';
import {useGraphQLMutation} from '~/shared/graphql.ts';
import {SignInWithAppleButton} from '~/shared/auth.ts';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';
import startPasskeySignInMutation from './graphql/StartPasskeySignInMutation.graphql';
import finishPasskeySignInMutation from './graphql/FinishPasskeySignInMutation.graphql';
import signInWithAppleMutation from './graphql/SignInWithAppleMutation.graphql';

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
  usePerformanceNavigation();

  const currentUrl = useCurrentURL();

  const [reason, setReason] = useState<SignInErrorReason | undefined>(
    (currentUrl.searchParams.get(SearchParam.Reason) as any) ?? undefined,
  );

  return (
    <BlockStack spacing padding>
      <Heading>Sign in</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <SignInWithEmail />

      <TextBlock>or...</TextBlock>

      <SignInWithApple onError={setReason} />
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
          autocomplete="webauthn username"
          onInput={(value) => {
            email.value = value;
          }}
        />
        <Button
          disabled={disabled}
          onPress={async () => {
            await signInWithEmail({email: email.value});
          }}
        >
          Sign in email
        </Button>
        <Button perform="submit" disabled={disabled}>
          Sign in with Passkey
        </Button>
      </BlockStack>
    </Form>
  );
}

function useSignInWithPasskey() {
  const router = useRouter();
  const startPasskeySignIn = useGraphQLMutation(startPasskeySignInMutation);
  const finishPasskeySignIn = useGraphQLMutation(finishPasskeySignInMutation);

  const {signInWithPasskey, prepareBrowserAutocomplete} = useMemo(() => {
    return {signInWithPasskey, prepareBrowserAutocomplete};

    async function signInWithPasskey({
      email,
      browserAutofill = false,
    }: {email?: string; browserAutofill?: boolean} = {}) {
      const [{startAuthentication}, options] = await Promise.all([
        import('@simplewebauthn/browser'),
        startPasskeySignIn.run({
          email,
        }),
      ]);

      if (options.data == null) {
        // TODO: handle error
        return;
      }

      const authenticationResult = await startAuthentication({
        optionsJSON: JSON.parse(options.data.startPasskeySignIn.result),
        useBrowserAutofill: browserAutofill,
      });

      const result = await finishPasskeySignIn.run({
        credential: JSON.stringify(authenticationResult),
      });

      if (result.data?.finishPasskeySignIn.user?.id) {
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
        await signInWithPasskey({browserAutofill: true});
      } catch {
        // intentional noop
      }
    }
  }, []);

  useEffect(() => {
    prepareBrowserAutocomplete();
  }, [prepareBrowserAutocomplete]);

  return signInWithPasskey;
}

function useSignInWithEmail() {
  const navigate = useNavigate();
  const currentUrl = useCurrentURL();
  const signInWithEmail = useGraphQLMutation(signInWithEmailMutation);

  return async function doSignInWithEmail({email}: {email: string}) {
    const result = await signInWithEmail.run({
      email,
      redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
    });

    if (result.data?.signIn.nextStepUrl) {
      // Can’t update the user dynamically, so we need a full-page reload
      window.location.replace(result.data.signIn.nextStepUrl);
    } else {
      navigate('check-your-email');
    }
  };
}

function SignInWithApple({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const currentUrl = useCurrentURL();
  const signInWithApple = useGraphQLMutation(signInWithAppleMutation);

  return (
    <SignInWithAppleButton
      redirectUrl={new URL('/internal/auth/apple/sign-in/callback', currentUrl)}
      onPress={async ({idToken, authorizationCode}) => {
        const result = await signInWithApple.run({
          idToken,
          authorizationCode,
          redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
        });

        const targetUrl = result.data?.signInWithApple.nextStepUrl;

        if (targetUrl == null) {
          onError(SignInErrorReason.Generic);
          return;
        }

        // TODO: update app context with new user
        window.location.replace(targetUrl);
      }}
    >
      Sign in with Apple
    </SignInWithAppleButton>
  );
}

function SignInWithGithub({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const currentUrl = useCurrentURL();

  const open = useGithubOAuthModal(GithubOAuthFlow.SignIn, (event) => {
    if (event.success) {
      // TODO: update app context with new user
      window.location.replace(event.redirectTo);
    } else {
      onError(event.reason ?? SignInErrorReason.Generic);
    }
  });

  return (
    <Button
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
        });
      }}
    >
      Sign in with Github
    </Button>
  );
}

function SignInWithGoogle({
  onError,
}: {
  onError(reason: SignInErrorReason): void;
}) {
  const currentUrl = useCurrentURL();

  const open = useGoogleOAuthModal(GoogleOAuthFlow.SignIn, (event) => {
    if (event.success) {
      // TODO: update app context with new user
      window.location.replace(event.redirectTo);
    } else {
      onError(event.reason ?? SignInErrorReason.Generic);
    }
  });

  return (
    <Button
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
        });
      }}
    >
      Sign in with Google
    </Button>
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
    <View padding>
      <TextBlock>Check your email!</TextBlock>
    </View>
  );
}
