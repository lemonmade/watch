import type {ReactNode} from 'preact';
import {usePerformanceNavigation} from '@quilted/quilt/performance';

import {Text, InlineStack, View, Action, TextBlock} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {useQuery, useMutation} from '~/shared/graphql.ts';

import myAppsQuery from './graphql/MyAppsQuery.graphql';
import deleteMyAppMutation from './graphql/DeleteMyAppMutation.graphql';

export default function Apps() {
  const {data, isLoading, refetch} = useQuery(myAppsQuery);

  usePerformanceNavigation({state: isLoading ? 'loading' : 'complete'});

  const apps = data?.my.apps ?? [];

  const deleteApp = useMutation(deleteMyAppMutation, {
    onSettled: () => refetch(),
  });

  let content: ReactNode = null;

  if (isLoading) {
    content = <Text>Loading...</Text>;
  }

  if (apps.length === 0) {
    content = <Text>No apps yet. Install @watching/cli to get started!</Text>;
  }

  content = apps.map((app) => (
    <InlineStack key={app.id} spacing>
      <View>
        <TextBlock>id: {app.id}</TextBlock>
        <TextBlock>name: {app.name}</TextBlock>
        <TextBlock>extensions: {app.extensions.length}</TextBlock>
      </View>
      <Action
        onPress={() => {
          deleteApp.mutate({id: app.id});
        }}
      >
        Delete
      </Action>
    </InlineStack>
  ));

  return <Page heading="Apps">{content}</Page>;
}
