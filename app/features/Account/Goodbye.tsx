import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {TextBlock, BlockStack, Button} from '@lemon/zest';

export default function Goodbye() {
  usePerformanceNavigation();

  return (
    <BlockStack padding spacing>
      <TextBlock>Until we meet again!</TextBlock>
      <Button to="/">Go home</Button>
    </BlockStack>
  );
}
