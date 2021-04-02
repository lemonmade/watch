import {Link, View, Heading, BlockStack} from '@lemon/zest';

enum SearchParam {
  RedirectTo = 'redirect',
}

export function Login() {
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
      </BlockStack>
    </View>
  );
}
