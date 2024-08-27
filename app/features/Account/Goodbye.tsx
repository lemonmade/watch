import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {TextBlock, BlockStack, Action} from '@lemon/zest';

export default function Goodbye() {
  usePerformanceNavigation();

  return (
    <BlockStack padding spacing>
      <TextBlock>Until we meet again!</TextBlock>
      <Action to="/">Go home</Action>
    </BlockStack>
  );
}
