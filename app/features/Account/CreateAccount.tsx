import {useState} from 'react';
import {
  useNavigate,
  useCurrentUrl,
  useSignal,
  usePerformanceNavigation,
} from '@quilted/quilt';
import {
  Action,
  Banner,
  TextField,
  Form,
  BlockStack,
  TextBlock,
  Heading,
  Text,
} from '@lemon/zest';

import {CreateAccountErrorReason} from '~/global/auth.ts';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github.ts';
import {useGoogleOAuthModal, GoogleOAuthFlow} from '~/shared/google.ts';
import {useMutation} from '~/shared/graphql.ts';

import createAccountWithEmailMutation from './graphql/CreateAccountWithEmailMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  GiftCode = 'gift-code',
  RedirectTo = 'redirect',
}

export default function CreateAccount() {
  usePerformanceNavigation({state: 'complete'});

  const currentUrl = useCurrentUrl();

  const giftCode = currentUrl.searchParams.get(SearchParam.GiftCode);

  const [reason, setReason] = useState<CreateAccountErrorReason | undefined>(
    (currentUrl.searchParams.get(SearchParam.Reason) as any) ?? undefined,
  );

  return (
    <BlockStack spacing padding="base">
      <Heading>Create account</Heading>

      {reason && <ErrorBanner reason={reason} />}

      {giftCode ? (
        <Banner>
          Using gift code <Text emphasis>{giftCode}</Text>
        </Banner>
      ) : null}

      <CreateAccountWithEmail />

      <TextBlock>or...</TextBlock>

      <CreateAccountWithGithub onError={setReason} />
      <CreateAccountWithGoogle onError={setReason} />
    </BlockStack>
  );
}

function CreateAccountWithEmail() {
  const email = useSignal('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const createAccountWithEmail = useMutation(createAccountWithEmailMutation);

  return (
    <Form
      onSubmit={() => {
        createAccountWithEmail.mutate(
          {
            email: email.value,
            code: currentUrl.searchParams.get(SearchParam.GiftCode),
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
      <TextField
        label="Email"
        value={email}
        keyboardType="email"
        autocomplete="email"
      />
    </Form>
  );
}

function CreateAccountWithGithub({
  onError,
}: {
  onError(reason: CreateAccountErrorReason): void;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();

  const open = useGithubOAuthModal(GithubOAuthFlow.CreateAccount, (event) => {
    if (event.success) {
      navigate(event.redirectTo);
    } else {
      onError(event.reason ?? CreateAccountErrorReason.Generic);
    }
  });

  return (
    <Action
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
    </Action>
  );
}

function CreateAccountWithGoogle({
  onError,
}: {
  onError(reason: CreateAccountErrorReason): void;
}) {
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();

  const open = useGoogleOAuthModal(GoogleOAuthFlow.CreateAccount, (event) => {
    if (event.success) {
      navigate(event.redirectTo);
    } else {
      onError(event.reason ?? CreateAccountErrorReason.Generic);
    }
  });

  return (
    <Action
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
    </Action>
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
