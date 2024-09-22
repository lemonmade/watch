import type {ComponentChild} from 'preact';
import {usePerformanceNavigation} from '@quilted/quilt/performance';

import {Text, InlineStack, View, Button, TextBlock} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLQueryData,
  useGraphQLQueryRefetchOnMount,
  useGraphQLMutation,
} from '~/shared/graphql.ts';

import myAppsQuery from './graphql/MyAppsQuery.graphql';
import deleteMyAppMutation from './graphql/DeleteMyAppMutation.graphql';

export default function Apps() {
  const query = useGraphQLQuery(myAppsQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {my} = useGraphQLQueryData(query);
  const {apps} = my;

  usePerformanceNavigation();

  const deleteApp = useGraphQLMutation(deleteMyAppMutation);

  let content: ComponentChild = null;

  if (apps.length === 0) {
    content = <Text>No apps yet. Install @watching/cli to get started!</Text>;
  } else {
    content = apps.map((app) => (
      <InlineStack key={app.id} spacing>
        <View>
          <TextBlock>id: {app.id}</TextBlock>
          <TextBlock>name: {app.name}</TextBlock>
          <TextBlock>extensions: {app.extensions.length}</TextBlock>
        </View>
        <Button
          onPress={async () => {
            await deleteApp.run({id: app.id});
            await query.rerun();
          }}
        >
          Delete
        </Button>
      </InlineStack>
    ));
  }

  return <Page heading="Apps">{content}</Page>;
}
