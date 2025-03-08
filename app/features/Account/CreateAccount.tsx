import {useState} from 'preact/hooks';
import {useSignal} from '@quilted/quilt/signals';
import {useNavigate, useCurrentURL} from '@quilted/quilt/navigation';
import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  Button,
  Banner,
  TextField,
  Form,
  BlockStack,
  TextBlock,
  Heading,
  Text,
} from '@lemon/zest';

import {CreateAccountErrorReason} from '~/global/auth.ts';
import {SignInWithAppleButton} from '~/shared/auth.ts';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github.ts';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google.ts';
import {useGraphQLMutation} from '~/shared/graphql.ts';

import createAccountWithEmailMutation from './graphql/CreateAccountWithEmailMutation.graphql';
import createAccountWithAppleMutation from './graphql/CreateAccountWithAppleMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  GiftCode = 'gift-code',
  RedirectTo = 'redirect',
}

export default function CreateAccount() {
  usePerformanceNavigation();

  const currentUrl = useCurrentURL();

  const giftCode = currentUrl.searchParams.get(SearchParam.GiftCode);

  const [reason, setReason] = useState<CreateAccountErrorReason | undefined>(
    (currentUrl.searchParams.get(SearchParam.Reason) as any) ?? undefined,
  );

  return (
    <BlockStack spacing padding>
      <Heading>Create account</Heading>

      {reason && <ErrorBanner reason={reason} />}

      {giftCode ? (
        <Banner>
          Using gift code <Text emphasis>{giftCode}</Text>
        </Banner>
      ) : null}

      <CreateAccountWithEmail />

      <TextBlock>or...</TextBlock>

      <CreateAccountWithApple onError={setReason} />
      <CreateAccountWithGithub onError={setReason} />
      <CreateAccountWithGoogle onError={setReason} />
    </BlockStack>
  );
}

function CreateAccountWithEmail() {
  const email = useSignal('');
  const navigate = useNavigate();
  const currentUrl = useCurrentURL();
  const createAccountWithEmail = useGraphQLMutation(
    createAccountWithEmailMutation,
  );

  return (
    <Form
      onSubmit={async () => {
        const result = await createAccountWithEmail.run({
          email: email.value,
          code: currentUrl.searchParams.get(SearchParam.GiftCode),
          redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
        });

        if (result.data?.createAccount.nextStepUrl) {
          // Can’t update the user dynamically, so we need a full-page reload
          window.location.replace(result.data.createAccount.nextStepUrl);
        } else {
          navigate('check-your-email');
        }
      }}
    >
      <BlockStack spacing="small">
        <TextField
          label="Email"
          value={email}
          keyboardType="email"
          autocomplete="email"
        />

        <Button perform="submit">Create account with email</Button>
      </BlockStack>
    </Form>
  );
}

function CreateAccountWithApple({
  onError,
}: {
  onError(reason: CreateAccountErrorReason): void;
}) {
  const currentUrl = useCurrentURL();
  const createAccountWithApple = useGraphQLMutation(
    createAccountWithAppleMutation,
  );

  return (
    <SignInWithAppleButton
      redirectUrl={
        new URL('/internal/auth/apple/create-account/callback', currentUrl)
      }
      onPress={async ({idToken, authorizationCode}) => {
        const result = await createAccountWithApple.run({
          idToken,
          authorizationCode,
          code: currentUrl.searchParams.get(SearchParam.GiftCode),
          redirectTo: currentUrl.searchParams.get(SearchParam.RedirectTo),
        });

        const targetUrl = result.data?.createAccountWithApple.nextStepUrl;

        if (targetUrl == null) {
          onError(CreateAccountErrorReason.Generic);
          return;
        }

        // TODO: update app context with new user
        window.location.replace(targetUrl);
      }}
    >
      Create account with Apple
    </SignInWithAppleButton>
  );
}

function CreateAccountWithGithub({
  onError,
}: {
  onError(reason: CreateAccountErrorReason): void;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentURL();

  const open = useGithubOAuthModal(GithubOAuthFlow.CreateAccount, (event) => {
    if (event.success) {
      navigate(event.redirectTo);
    } else {
      onError(event.reason ?? CreateAccountErrorReason.Generic);
    }
  });

  return (
    <Button
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
          resolveUrl(url) {
            const code = currentUrl.searchParams.get(SearchParam.GiftCode);

            if (code) {
              url.searchParams.set(SearchParam.GiftCode, code);
            }

            return url;
          },
        });
      }}
    >
      Create account with Github
    </Button>
  );
}

function CreateAccountWithGoogle({
  onError,
}: {
  onError(reason: CreateAccountErrorReason): void;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentURL();

  const open = useGoogleOAuthModal(GoogleOAuthFlow.CreateAccount, (event) => {
    if (event.success) {
      navigate(event.redirectTo);
    } else {
      onError(event.reason ?? CreateAccountErrorReason.Generic);
    }
  });

  return (
    <Button
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
          resolveUrl(url) {
            const code = currentUrl.searchParams.get(SearchParam.GiftCode);

            if (code) {
              url.searchParams.set(SearchParam.GiftCode, code);
            }

            return url;
          },
        });
      }}
    >
      Create account with Google
    </Button>
  );
}

function ErrorBanner({reason}: {reason: CreateAccountErrorReason}) {
  switch (reason) {
    case CreateAccountErrorReason.GithubError: {
      return (
        <Banner tone="critical">
          There was an error while trying to create your account with Github.
          You can try again, or create an account with your email instead (you
          can always connect your Github account later). Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case CreateAccountErrorReason.GoogleError: {
      return (
        <Banner tone="critical">
          There was an error while trying to create your account with Google.
          You can try again, or create an account with your email instead (you
          can always connect your Google account later). Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case CreateAccountErrorReason.Expired: {
      return (
        <Banner tone="critical">
          Your temporary account creation token expired, so you’ll need to
          create your account again. Sorry for the inconvenience!
        </Banner>
      );
    }
    default: {
      return (
        <Banner tone="critical">
          Something went wrong while trying to create your account, so you’ll
          need to try again. Sorry for the inconvenience!
        </Banner>
      );
    }
  }
}
