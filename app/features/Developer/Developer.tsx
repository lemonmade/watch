import {BlockStack, InlineStack, Action} from '@lemon/zest';

import {Page} from '~/shared/page';

export function Developer() {
  return (
    <Page heading="Developer">
      <BlockStack spacing>
        <InlineStack spacing="small">
          <Action to="apps">Apps</Action>
          <Action to="access-tokens">Access tokens</Action>
          <Action to="console">Console</Action>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
