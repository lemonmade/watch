import {usePerformanceNavigation} from '@quilted/quilt';
import {TextBlock, BlockStack, Action} from '@lemon/zest';

export function Goodbye() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <BlockStack padding spacing>
      <TextBlock>Until we meet again!</TextBlock>
      <Action to="/">Go home</Action>
    </BlockStack>
  );
}
