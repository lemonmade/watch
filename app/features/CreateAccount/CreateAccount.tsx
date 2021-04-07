import {useState} from 'react';
import type {ReactNode} from 'react';
import {
  useMutation,
  useRoutes,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
import {
  Link,
  View,
  Banner,
  TextField,
  Form,
  BlockStack,
  TextBlock,
  Heading,
} from '@lemon/zest';

import createAccountWithEmailMutation from './graphql/CreateAccountWithEmailMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  RedirectTo = 'redirect',
}

export enum CreateAccountErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
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

  const createAccountReason = currentUrl.searchParams.get(SearchParam.Reason);

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

      <Link
        to={(url) => {
          const targetUrl = new URL(
            '/internal/auth/github/create-account',
            url,
          );
          const redirectTo = url.searchParams.get(SearchParam.RedirectTo);

          if (redirectTo) {
            targetUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
          }

          return targetUrl;
        }}
      >
        Create account with Github
      </Link>
    </View>
  );
}

function CheckYourEmail() {
  return <TextBlock>Check your email!</TextBlock>;
}
