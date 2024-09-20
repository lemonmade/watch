import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {BlockStack, InlineStack, Button} from '@lemon/zest';

import {Page} from '~/shared/page.ts';

export default function Developer() {
  usePerformanceNavigation({state: 'complete'});

  return (
    <Page heading="Developer">
      <BlockStack spacing>
        <InlineStack spacing="small">
          <Button to="apps">Apps</Button>
          <Button to="access-tokens">Access tokens</Button>
          <Button to="console">Console</Button>
          <Button to="/api/graphql/explorer" target="current">
            GraphQL
          </Button>
          <Button to="/internal/components">Component library</Button>
        </InlineStack>
      </BlockStack>
    </Page>
  );
}
