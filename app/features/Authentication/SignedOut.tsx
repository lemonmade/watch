import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {TextBlock, BlockStack, Action} from '@lemon/zest';

export default function SignedOut() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <BlockStack spacing padding>
      <TextBlock>Until next time!</TextBlock>
      <Action to="/sign-in">Sign back in</Action>
    </BlockStack>
  );
}
