import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {Heading, TextBlock, Text, BlockStack, Button} from '@lemon/zest';

export default function Start() {
  usePerformanceNavigation();

  return (
    <BlockStack spacing padding>
      <Heading>What are we watching next? (from preview)</Heading>

      <TextBlock>
        <Text emphasis="strong">Watch</Text> is an app to keep track of the
        shows you’re watching. It’s fast and pleasant to use. It’s built with
        security and accessibility as top priorities, and it’s entirely open
        source, too.
      </TextBlock>

      <Button to="/sign-in">Sign in</Button>
      <Button to="/create-account">Create account</Button>
      <Button to="/app">Go to app</Button>
    </BlockStack>
  );
}
