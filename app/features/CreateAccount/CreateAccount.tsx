import {useState} from 'react';
import {useRoutes, useNavigate, useCurrentUrl} from '@quilted/quilt';
import {
  Action,
  View,
  Banner,
  TextField,
  Form,
  BlockStack,
  TextBlock,
  Heading,
} from '@lemon/zest';
import {useSignal} from '@watching/react-signals';

import {CreateAccountErrorReason} from '~/global/auth';
import {useGithubOAuthModal, GithubOAuthFlow} from '~/shared/github';
import {useMutation} from '~/shared/graphql';

import createAccountWithEmailMutation from './graphql/CreateAccountWithEmailMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  RedirectTo = 'redirect',
}

export function CreateAccount() {
  return useRoutes([
    {match: '/', render: () => <CreateAccountForm />},
    {match: 'check-your-email', render: () => <CheckYourEmail />},
  ]);
}

export function CreateAccountForm() {
  const currentUrl = useCurrentUrl();

  const [reason, setReason] = useState<CreateAccountErrorReason | undefined>(
    (currentUrl.searchParams.get(SearchParam.Reason) as any) ?? undefined,
  );

  return (
    <BlockStack spacing padding="base">
      <Heading>Create account</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <CreateAccountWithEmail />

      <TextBlock>or...</TextBlock>

      <CreateAccountWithGithub onError={setReason} />
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
      <TextField type="email" label="Email" value={email} />
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
        });
      }}
    >
      Create account with Github
    </Action>
  );
}

function ErrorBanner({reason}: {reason: CreateAccountErrorReason}) {
  switch (reason) {
    case CreateAccountErrorReason.GithubError: {
      return (
        <Banner status="error">
          There was an error while trying to create your account with Github.
          You can try again, or create an account with your email instead (you
          can always connect your Github account later). Sorry for the
          inconvenience!
        </Banner>
      );
    }
    case CreateAccountErrorReason.Expired: {
      return (
        <Banner status="error">
          Your temporary account creation token expired, so you’ll need to
          create your account again. Sorry for the inconvenience!
        </Banner>
      );
    }
    default: {
      return (
        <Banner status="error">
          Something went wrong while trying to create your account, so you’ll
          need to try again. Sorry for the inconvenience!
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
