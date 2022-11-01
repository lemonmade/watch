import {type ExtensionPoint} from '@watching/clips';
import {type PropsWithChildren} from '@quilted/quilt';
import {
  Popover,
  BlockStack,
  View,
  Text,
  Menu,
  ContentAction,
  Layout,
  Icon,
  Action,
} from '@lemon/zest';

import {useMutation} from '~/shared/graphql';

import {
  InstalledClipsExtensionPoint,
  type ClipsExtensionPoint,
} from '../extension';

import uninstallClipsExtensionFromClipMutation from './graphql/UninstallClipsExtensionFromClipMutation.graphql';
import styles from './ClipFrame.module.css';

export function ClipFrame<Point extends ExtensionPoint>({
  children,
  extension,
}: PropsWithChildren<{
  extension: ClipsExtensionPoint<Point>;
}>) {
  const {name, app} = extension.extension;

  return (
    <BlockStack spacing="small">
      <ContentAction
        popover={
          <Popover inlineAttachment="start">
            <Menu>
              <Action
                icon="arrowEnd"
                onPress={() => alert('App page not implemented yet!')}
              >
                View app
              </Action>
              {/* <Action icon="sync" onPress={() => controller.restart()}>
                Restart
              </Action> */}
              {extension.installed && (
                <UninstallClipAction
                  extension={extension}
                  installed={extension.installed}
                />
              )}
              {extension.installed && (
                <Action
                  icon="message"
                  onPress={() => alert('Reporting not implemented yet!')}
                >
                  Report an issue
                </Action>
              )}
            </Menu>
          </Popover>
        }
      >
        <Layout columns={['auto', 'fill']} spacing="small">
          <View
            display="inlineFlex"
            background="emphasized"
            border="subdued"
            cornerRadius
            inlineAlignment="center"
            className={styles.AppIcon}
          >
            <Icon source="app" />
          </View>
          <BlockStack>
            <Text emphasis>{name}</Text>
            <Text emphasis="subdued" size="small">
              from app <Text emphasis>{app.name}</Text>
            </Text>
          </BlockStack>
        </Layout>
      </ContentAction>

      <View>{children}</View>
    </BlockStack>
  );
}

function UninstallClipAction({
  extension,
}: {
  extension: ClipsExtensionPoint<any>;
  installed: InstalledClipsExtensionPoint;
}) {
  const uninstallClipsExtensionFromClip = useMutation(
    uninstallClipsExtensionFromClipMutation,
  );

  const {id} = extension.extension;

  return (
    <Action
      icon="delete"
      onPress={async () => {
        await uninstallClipsExtensionFromClip.mutateAsync({id});
      }}
    >
      Uninstall
    </Action>
  );
}
