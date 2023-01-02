import {usePerformanceNavigation} from '@quilted/quilt';
import {TextBlock, BlockStack, Action} from '@lemon/zest';

export function SignedOut() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <BlockStack spacing padding>
      <TextBlock>Until next time!</TextBlock>
      <Action to="/sign-in">Sign back in</Action>
    </BlockStack>
  );
}
