import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {TextBlock, BlockStack, Button} from '@lemon/zest';

export default function SignedOut() {
  usePerformanceNavigation();

  return (
    <BlockStack spacing padding>
      <TextBlock>Until next time!</TextBlock>
      <Button to="/sign-in">Sign back in</Button>
    </BlockStack>
  );
}
