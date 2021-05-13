import {useState} from 'react';
import {useQuery, useMutation} from '@quilted/quilt';
import {BlockStack, View, TextBlock, Button, InlineStack} from '@lemon/zest';

import {Page} from 'components';

import appsQuery from './graphql/AppsQuery.graphql';
import installAppMutation from './graphql/InstallAppMutation.graphql';
import installClipsExtensionMutation from './graphql/InstallClipsExtensionMutation.graphql';

export function Apps() {
  const [key, setKey] = useState(0);
  const {data} = useQuery(appsQuery, {variables: {key} as any});
  const installApp = useMutation(installAppMutation);
  const installExtension = useMutation(installClipsExtensionMutation);

  return (
    <Page heading="Apps">
      <BlockStack>
        {data?.apps.map((app) => (
          <View key={app.id}>
            <InlineStack>
              <TextBlock>{app.name}</TextBlock>
              {!app.isInstalled && (
                <Button
                  onPress={async () => {
                    await installApp({variables: {id: app.id}});
                    setKey((key) => key + 1);
                  }}
                >
                  Install
                </Button>
              )}
            </InlineStack>
            {app.isInstalled && (
              <View>
                <BlockStack>
                  {app.extensions
                    .filter(
                      (extension) => extension.__typename === 'ClipsExtension',
                    )
                    .map((extension: any) => (
                      <View key={extension.id}>
                        <InlineStack>
                          <TextBlock>{extension.name}</TextBlock>
                          {!extension.isInstalled && (
                            <Button
                              onPress={async () => {
                                await installExtension({
                                  variables: {
                                    id: extension.id,
                                    extensionPoint:
                                      extension.latestVersion?.supports[0]
                                        ?.extensionPoint,
                                  },
                                });
                                setKey((key) => key + 1);
                              }}
                            >
                              Install
                            </Button>
                          )}
                        </InlineStack>
                      </View>
                    ))}
                </BlockStack>
              </View>
            )}
          </View>
        ))}
      </BlockStack>
    </Page>
  );
}
