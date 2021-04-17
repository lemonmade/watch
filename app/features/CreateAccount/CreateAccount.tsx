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
import {GithubOAuthModal} from 'components';

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
    <View padding={16}>
      <Heading>Create account</Heading>

      {reason && <ErrorBanner reason={reason} />}

      <CreateAccountWithEmail />

      <TextBlock>or...</TextBlock>

      <CreateAccountWithGithub onError={setReason} />
    </View>
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
      <BlockStack>
        <TextField label="Email" onChange={(value) => setEmail(value)} />
      </BlockStack>
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
  const [open, setOpen] = useState<false | URL>(false);

  return (
    <>
      <GithubOAuthModal
        type="createAccount"
        open={open}
        onEvent={(event, modal) => {
          modal.close();

          if (event.success) {
            navigate(event.redirectTo);
          } else {
            onError(event.reason ?? CreateAccountErrorReason.Generic);
          }
        }}
      />
      <Button
        onPress={() => {
          const targetUrl = new URL(
            '/internal/auth/github/create-account',
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
  return <TextBlock>Check your email!</TextBlock>;
}
