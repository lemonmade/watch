import {BlockStack, InlineStack, Link} from '@lemon/zest';

import {Page} from '~/components';

export function Developer() {
  return (
    <Page heading="Developer">
      <BlockStack>
        <InlineStack>
          <Link to="apps">Apps</Link>
          <Link to="access-tokens">Access tokens</Link>
          <Link to="console">Console</Link>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
