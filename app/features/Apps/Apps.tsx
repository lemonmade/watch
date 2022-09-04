import {BlockStack, View, TextBlock, Action, InlineStack} from '@lemon/zest';

import {Page} from '~/shared/page';
import {useQuery, useMutation} from '~/shared/graphql';

import appsQuery, {type AppsQueryData} from './graphql/AppsQuery.graphql';
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
      <BlockStack spacing>
        {data?.apps.map((app) => (
          <View key={app.id}>
            <InlineStack spacing>
              <TextBlock>{app.name}</TextBlock>
              {!app.isInstalled && (
                <Action
                  onPress={() => {
                    installApp.mutate({id: app.id});
                  }}
                >
                  Install
                </Action>
              )}
            </InlineStack>
            {app.isInstalled && (
              <View>
                <BlockStack spacing>
                  {app.extensions
                    .filter(
                      (
                        extension,
                      ): extension is AppsQueryData.Apps.Extensions_ClipsExtension =>
                        extension.__typename === 'ClipsExtension' &&
                        // TODO: should not be able to load unpublished extensions!
                        extension.latestVersion != null,
                    )
                    .map((extension) => (
                      <View key={extension.id}>
                        <InlineStack spacing>
                          <TextBlock>{extension.name}</TextBlock>
                          {!extension.isInstalled && (
                            <Action
                              onPress={() => {
                                installExtension.mutate({
                                  id: extension.id,
                                  target:
                                    extension.latestVersion?.extends[0]?.target,
                                });
                              }}
                            >
                              Install
                            </Action>
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
