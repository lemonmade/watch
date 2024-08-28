import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {BlockStack, View, TextBlock, Action, InlineStack} from '@lemon/zest';

import {Page} from '~/shared/page.ts';
import {
  useGraphQLQuery,
  useGraphQLMutation,
  useGraphQLQueryRefetchOnMount,
  useGraphQLQueryData,
} from '~/shared/graphql.ts';

import appsQuery, {type AppsQueryData} from './graphql/AppsQuery.graphql';
import installAppMutation from './graphql/InstallAppMutation.graphql';
import installClipsExtensionMutation from './graphql/InstallClipsExtensionMutation.graphql';

export default function Apps() {
  const query = useGraphQLQuery(appsQuery);
  useGraphQLQueryRefetchOnMount(query);

  const {apps} = useGraphQLQueryData(query);

  usePerformanceNavigation();

  const installApp = useGraphQLMutation(installAppMutation);
  const installExtension = useGraphQLMutation(installClipsExtensionMutation);

  return (
    <Page heading="Apps">
      <BlockStack spacing>
        {apps.map((app) => (
          <View key={app.id}>
            <InlineStack spacing>
              <TextBlock>{app.name}</TextBlock>
              {!app.isInstalled && (
                <Action
                  onPress={async () => {
                    await installApp.run({id: app.id});
                    await query.rerun();
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
                              onPress={async () => {
                                await installExtension.run({
                                  id: extension.id,
                                  target:
                                    extension.latestVersion?.extends[0]?.target,
                                });
                                await query.rerun();
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
