import {useState} from 'react';
import {
  useMutation,
  useRoutes,
  useNavigate,
  useCurrentUrl,
} from '@quilted/quilt';
import {Link, View, TextField, Form, BlockStack, TextBlock} from '@lemon/zest';

import createAccountWithEmailMutation from './graphql/CreateAccountWithEmailMutation.graphql';

enum SearchParam {
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

  return (
    <View padding={16}>
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

      <TextBlock>or with email:</TextBlock>

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
    </View>
  );
}

function CheckYourEmail() {
  return <TextBlock>Check your email!</TextBlock>;
}
