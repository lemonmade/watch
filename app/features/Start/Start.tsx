import {View, Heading, TextBlock, Text, BlockStack, Link} from '@lemon/zest';

export function Start() {
  return (
    <View padding={16}>
      <BlockStack>
        <Heading>What are we watching next?</Heading>

        <TextBlock>
          <Text emphasis="strong">Watch</Text> is an app to keep track of the
          shows you’re watching. It’s fast and pleasant to use. It’s built with
          security and accessibility as top priorities, and it’s entirely open
          source, too.
        </TextBlock>

        <Link to="/sign-in">Sign in</Link>
        <Link to="/create-account">Create account</Link>
        <Link to="/app">Go to app</Link>
      </BlockStack>
    </View>
  );
}
