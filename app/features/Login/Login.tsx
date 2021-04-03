import {useState} from 'react';
import {
  Link,
  View,
  TextField,
  Form,
  Heading,
  BlockStack,
  TextBlock,
} from '@lemon/zest';

enum SearchParam {
  RedirectTo = 'redirect',
}

export function Login() {
  const [email, setEmail] = useState('');

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
          onSubmit={() => {
            // eslint-disable-next-line no-console
            console.log({email});
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
