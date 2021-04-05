import {useState} from 'react';
import {
  useMutation,
  useRoutes,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
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

enum SearchParam {
  RedirectTo = 'redirect',
}

export function SignIn() {
  return useRoutes([
    {match: '/', render: () => <SignInForm />},
    {match: 'check-your-email', render: () => <CheckYourEmail />},
    {render: () => <NotFound />},
  ]);
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const currentUrl = useCurrentUrl();
  const signInWithEmail = useMutation(signInWithEmailMutation);

  return (
    <View padding={16}>
      <BlockStack>
        <Heading>Sign in</Heading>

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
