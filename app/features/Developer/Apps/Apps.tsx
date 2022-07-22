import type {ReactNode} from 'react';

import {Text, InlineStack, View, Button, TextBlock} from '@lemon/zest';

import {Page} from '~/components';
import {useQuery, useMutation} from '~/shared/graphql';

import myAppsQuery from './graphql/MyAppsQuery.graphql';
import deleteMyAppMutation from './graphql/DeleteMyAppMutation.graphql';

export function Apps() {
  const {data, isLoading, refetch} = useQuery(myAppsQuery);
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
    <InlineStack key={app.id}>
      <View>
        <TextBlock>id: {app.id}</TextBlock>
        <TextBlock>name: {app.name}</TextBlock>
        <TextBlock>extensions: {app.extensions.length}</TextBlock>
      </View>
      <Button
        onPress={() => {
          deleteApp.mutate({id: app.id});
        }}
      >
        Delete
      </Button>
    </InlineStack>
  ));

  return <Page heading="Apps">{content}</Page>;
}
