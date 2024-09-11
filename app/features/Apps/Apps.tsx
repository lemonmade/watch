import {usePerformanceNavigation} from '@quilted/quilt/performance';
import {
  BlockStack,
  View,
  TextBlock,
  Action,
  InlineStack,
  Section,
  Banner,
  Text,
} from '@lemon/zest';

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
import createAppSecretMutation from './graphql/CreateAppSecretMutation.graphql';

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

            <AppSecretSection app={app} />

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

function AppSecretSection({app}: {app: AppsQueryData.Apps}) {
  const createSecret = useGraphQLMutation(createAppSecretMutation);

  const latestSecret =
    createSecret.resolved?.value?.data?.createAppSecret.secret;

  return (
    <Section>
      <BlockStack spacing>
        {latestSecret ? (
          <Banner>
            <TextBlock>
              A new secret has been created for your app. You will only see this
              value once, so make sure to take note of it somewhere safe.
            </TextBlock>

            <TextBlock>
              Secret: <Text emphasis>{latestSecret}</Text>
            </TextBlock>
          </Banner>
        ) : (
          <TextBlock>
            {app.hasSecret
              ? 'Has already created secret'
              : 'App secret already created'}
          </TextBlock>
        )}

        <TextBlock>
          {app.userDetailsJWT}
        </TextBlock>

        <InlineStack>
          <Action
            onPress={async () => {
              const result = await createSecret.run({id: app.id});
              console.log(result);
            }}
            inlineSize="content"
          >
            Create secret
          </Action>
        </InlineStack>
      </BlockStack>
    </Section>
  );
}
