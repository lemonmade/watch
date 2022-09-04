import {TextBlock, BlockStack, Action} from '@lemon/zest';

export function Goodbye() {
  return (
    <BlockStack padding spacing>
      <TextBlock>Until we meet again!</TextBlock>
      <Action to="/">Go home</Action>
    </BlockStack>
  );
}
