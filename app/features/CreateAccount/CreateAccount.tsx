import {useState} from 'react';
import type {ReactNode} from 'react';
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

import {
  openGithubOAuthPopover,
  useGithubOAuthPopoverEvents,
} from 'utilities/github';
import {CreateAccountErrorReason} from 'global/utilities/auth';

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
  const [email, setEmail] = useState('');

  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const createAccountWithEmail = useMutation(createAccountWithEmailMutation);

  const [createAccountReason, setCreateAccountReason] = useState(
    currentUrl.searchParams.get(SearchParam.Reason) ?? undefined,
  );

  useGithubOAuthPopoverEvents((event, popover) => {
    if (event.type !== 'createAccount') return;

    popover.close();

    if (event.success) {
      navigate(event.redirectTo);
    } else {
      setCreateAccountReason(event.reason ?? CreateAccountErrorReason.Generic);
    }
  });

  let errorBanner: ReactNode = null;

  if (createAccountReason) {
    switch (createAccountReason) {
      case CreateAccountErrorReason.GithubError: {
        errorBanner = (
          <Banner status="error">
            There was an error while trying to create your account with Github.
            You can try again, or create an account with your email instead (you
            can always connect your Github account later). Sorry for the
            inconvenience!
          </Banner>
        );
        break;
      }
      case CreateAccountErrorReason.Expired: {
        errorBanner = (
          <Banner status="error">
            Your temporary account creation token expired, so you’ll need to
            create your account again. Sorry for the inconvenience!
          </Banner>
        );
        break;
      }
      case CreateAccountErrorReason.Generic: {
        errorBanner = (
          <Banner status="error">
            Something went wrong while trying to create your account, so you’ll
            need to try again. Sorry for the inconvenience!
          </Banner>
        );
        break;
      }
    }
  }

  return (
    <View padding={16}>
      <Heading>Create account</Heading>

      {errorBanner}

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

      <TextBlock>or...</TextBlock>

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

          openGithubOAuthPopover(targetUrl);
        }}
      >
        Create account with Github
      </Button>
    </View>
  );
}

function CheckYourEmail() {
  return <TextBlock>Check your email!</TextBlock>;
}
