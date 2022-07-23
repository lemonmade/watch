import {BlockStack, View, TextBlock, Button, InlineStack} from '@lemon/zest';

import {Page} from '~/components';
import {useQuery, useMutation} from '~/shared/graphql';

import appsQuery from './graphql/AppsQuery.graphql';
import installAppMutation from './graphql/InstallAppMutation.graphql';
import installClipsExtensionMutation from './graphql/InstallClipsExtensionMutation.graphql';

export function Apps() {
  const {data, refetch} = useQuery(appsQuery);
  const installApp = useMutation(installAppMutation, {
    onSettled: () => refetch(),
  });
  const installExtension = useMutation(installClipsExtensionMutation, {
    onSettled: () => refetch(),
  });

  return (
    <Page heading="Apps">
      <BlockStack>
        {data?.apps.map((app) => (
          <View key={app.id}>
            <InlineStack>
              <TextBlock>{app.name}</TextBlock>
              {!app.isInstalled && (
                <Button
                  onPress={() => {
                    installApp.mutate({id: app.id});
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
                      (extension) =>
                        extension.__typename === 'ClipsExtension' &&
                        // TODO: should not be able to load unpublished extensions!
                        extension.latestVersion != null,
                    )
                    .map((extension: any) => (
                      <View key={extension.id}>
                        <InlineStack>
                          <TextBlock>{extension.name}</TextBlock>
                          {!extension.isInstalled && (
                            <Button
                              onPress={() => {
                                installExtension.mutate({
                                  id: extension.id,
                                  target:
                                    extension.latestVersion?.supports[0]?.name,
                                });
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
