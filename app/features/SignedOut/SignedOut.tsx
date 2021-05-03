import {TextBlock, BlockStack, Link} from '@lemon/zest';

export function SignedOut() {
  return (
    <BlockStack padding="base">
      <TextBlock>Until next time!</TextBlock>
      <Link to="/sign-in">Sign back in</Link>
    </BlockStack>
  );
}
