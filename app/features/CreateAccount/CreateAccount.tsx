import {useState} from 'react';
import {
  useMutation,
  useRoutes,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
import {
  Button,
  View,
  Banner,
  TextField,
  Form,
  BlockStack,
  TextBlock,
  Heading,
} from '@lemon/zest';

import {CreateAccountErrorReason} from 'global/utilities/auth';
import {useGithubOAuthModal, GithubOAuthFlow} from 'utilities/github';

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
    <BlockStack padding="base">
      <Heading>Create account</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <CreateAccountWithEmail />

      <TextBlock>or...</TextBlock>

      <CreateAccountWithGithub onError={setReason} />
    </BlockStack>
  );
}

function CreateAccountWithEmail() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const createAccountWithEmail = useMutation(createAccountWithEmailMutation);

  return (
    <Form
      onSubmit={async () => {
        await createAccountWithEmail({
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
    <Button
      onPress={() => {
        open({
          redirectTo:
            currentUrl.searchParams.get(SearchParam.RedirectTo) ?? undefined,
        });
      }}
    >
      Create account with Github
    </Button>
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
