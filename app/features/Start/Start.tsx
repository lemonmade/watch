import {Heading, TextBlock, Text, BlockStack, Action} from '@lemon/zest';

export function Start() {
  return (
    <BlockStack padding>
      <Heading>What are we watching next?</Heading>

      <TextBlock>
        <Text emphasis="strong">Watch</Text> is an app to keep track of the
        shows you’re watching. It’s fast and pleasant to use. It’s built with
        security and accessibility as top priorities, and it’s entirely open
        source, too.
      </TextBlock>

      <Action to="/sign-in">Sign in</Action>
      <Action to="/create-account">Create account</Action>
      <Action to="/app">Go to app</Action>
    </BlockStack>
  );
}
