import {useState} from 'react';
import {useMutation, useRoutes, useNavigate} from '@quilted/quilt';
import {NotFound} from '@quilted/quilt/http';
import {
  Link,
  View,
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
} from '@lemon/zest';

import signInWithEmailMutation from './graphql/SignInWithEmailMutation.graphql';
import signUpWithEmailMutation from './graphql/SignUpWithEmailMutation.graphql';

enum SearchParam {
  RedirectTo = 'redirect',
}

export function Login() {
  return useRoutes([
    {match: '/', render: () => <LoginForm />},
    {match: 'check-your-email', render: () => <CheckYourEmail />},
    {render: () => <NotFound />},
  ]);
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const signInWithEmail = useMutation(signInWithEmailMutation);
  const signUpWithEmail = useMutation(signUpWithEmailMutation);

  return (
    <View padding={16}>
      <BlockStack>
        <Heading>Login</Heading>
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
          Login with Github
        </Link>

        <TextBlock>or</TextBlock>

        <Form
          onSubmit={async () => {
            await signInWithEmail({variables: {email}});
            navigate('check-your-email');
          }}
        >
          <BlockStack>
            <TextField onChange={(value) => setEmail(value)} />
          </BlockStack>
        </Form>

        <TextBlock>or</TextBlock>

        <Link
          to={(url) => {
            const targetUrl = new URL('/internal/auth/github/sign-up', url);
            const redirectTo = url.searchParams.get(SearchParam.RedirectTo);

            if (redirectTo) {
              targetUrl.searchParams.set(SearchParam.RedirectTo, redirectTo);
            }

            return targetUrl;
          }}
        >
          Sign up with Github
        </Link>

        <TextBlock>or</TextBlock>

        <Form
          onSubmit={async () => {
            await signUpWithEmail({variables: {email}});
            navigate('check-your-email');
          }}
        >
          <BlockStack>
            <TextField onChange={(value) => setEmail(value)} />
          </BlockStack>
        </Form>
      </BlockStack>
    </View>
  );
}

function CheckYourEmail() {
  return <TextBlock>Check your email!</TextBlock>;
}
