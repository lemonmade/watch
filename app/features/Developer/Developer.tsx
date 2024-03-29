import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {BlockStack, InlineStack, Action} from '@lemon/zest';

import {Page} from '~/shared/page.ts';

export default function Developer() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <Page heading="Developer">
      <BlockStack spacing>
        <InlineStack spacing="small">
          <Action to="apps">Apps</Action>
          <Action to="access-tokens">Access tokens</Action>
          <Action to="console">Console</Action>
          <Action to="/api/graphql/explorer" target="current">
            GraphQL
          </Action>
          <Action to="/internal/components">Component library</Action>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
