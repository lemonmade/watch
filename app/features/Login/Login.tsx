import {Link, View, Heading, BlockStack} from '@lemon/zest';

export function Login() {
  return (
    <View padding={16}>
      <BlockStack>
        <Heading>Login</Heading>
        <Link to="/me/oauth/github/start">Login with Github</Link>
      </BlockStack>
    </View>
  );
}
