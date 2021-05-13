import type {ReactNode} from 'react';
import {useState} from 'react';

import {useQuery, useMutation} from '@quilted/quilt';
import {Text, InlineStack, View, Button, TextBlock} from '@lemon/zest';

import {Page} from 'components';

import myAppsQuery from './graphql/MyAppsQuery.graphql';
import deleteMyAppMutation from './graphql/DeleteMyAppMutation.graphql';

export function Apps() {
  const [key, setKey] = useState(0);

  const {data, loading} = useQuery(myAppsQuery, {variables: {key} as any});
  const apps = data?.my.apps ?? [];

  const deleteApp = useMutation(deleteMyAppMutation);

  let content: ReactNode = null;

  if (loading) {
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
        onPress={async () => {
          await deleteApp({variables: {id: app.id}});
          setKey((key) => key + 1);
        }}
      >
        Delete
      </Button>
    </InlineStack>
  ));

  return <Page heading="Apps">{content}</Page>;
}
