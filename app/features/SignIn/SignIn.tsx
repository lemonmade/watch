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
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
  Banner,
} from '@lemon/zest';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';

enum SearchParam {
  Reason = 'reason',
  RedirectTo = 'redirect',
}

export enum SignInErrorReason {
  Expired = 'expired',
  Generic = 'generic-error',
  GithubError = 'github-error',
  GithubNoAccount = 'github-no-account',
}

export function SignIn() {
  return useRoutes([
    {match: '/', render: () => <SignInForm />},
    {match: 'check-your-email', render: () => <CheckYourEmail />},
  ]);
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signInWithEmail = useMutation(signInWithEmailMutation);

  const signInReason = currentUrl.searchParams.get(SearchParam.Reason);

  let errorBanner: ReactNode = null;

  if (signInReason) {
    switch (signInReason) {
      case SignInErrorReason.GithubNoAccount: {
        errorBanner = (
          <Banner status="error">
            You authenticated with Github, but no account is linked with your
            Github profile. You’ll need to sign in with email, then connect
            Github from the <Link to="/app/me">account page</Link>.
          </Banner>
        );
        break;
      }
      case SignInErrorReason.GithubError: {
        errorBanner = (
          <Banner status="error">
            There was an error while trying to sign in with Github. You can try
            again, or sign in with your email instead. Sorry for the
            inconvenience!
          </Banner>
        );
        break;
      }
      case SignInErrorReason.Expired: {
        errorBanner = (
          <Banner status="error">
            Your temporary sign in token expired, so you’ll need to sign in
            again. Sorry for the inconvenience!
          </Banner>
        );
        break;
      }
      case SignInErrorReason.Generic: {
        errorBanner = (
          <Banner status="error">
            Something went wrong while trying to sign you in, so you’ll need to
            try again. Sorry for the inconvenience!
          </Banner>
        );
        break;
      }
    }
  }

  return (
    <View padding={16}>
      <BlockStack>
        <Heading>Sign in</Heading>

        {errorBanner}

        <Form
          onSubmit={async () => {
            await signInWithEmail({
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
            const targetUrl = new URL('/internal/auth/github/sign-in', url);
            const redirectTo = url.searchParams.get(SearchParam.RedirectTo);

            if (redirectTo) {
              targetUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
            }

            return targetUrl;
          }}
        >
          Sign in with Github
        </Link>
      </BlockStack>
    </View>
  );
}

function CheckYourEmail() {
  return <TextBlock>Check your email!</TextBlock>;
}
