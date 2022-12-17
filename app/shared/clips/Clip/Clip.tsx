import {useEffect, useMemo, useRef} from 'react';
import {type ExtensionPoint} from '@watching/clips';
import {RemoteRenderer, createController} from '@remote-ui/react/host';
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
  raw,
  Section,
} from '@lemon/zest';
import {classes} from '@lemon/css';

import {useMutation} from '~/shared/graphql';

import {useClipsManager} from '../react';
import {
  type ClipsExtensionPoint,
  type ClipsExtensionPointInstance,
} from '../extension';

import styles from './Clip.module.css';
import {ClipSettings} from './ClipSettings';
import uninstallClipsExtensionFromClipMutation from './graphql/UninstallClipsExtensionFromClipMutation.graphql';

export interface ClipProps<Point extends ExtensionPoint> {
  extension: ClipsExtensionPoint<Point>;
}

export function Clip<Point extends ExtensionPoint>({
  extension,
}: ClipProps<Point>) {
  const {name, app} = extension.extension;

  const manager = useClipsManager();
  const installed =
    extension.installed && manager.fetchInstance(extension.installed);
  const local = extension.local && manager.fetchInstance(extension.local);

  const renderer = local ?? installed;

  return (
    <Section>
      <BlockStack spacing>
        <ContentAction
          overlay={
            <Popover inlineAttachment="start">
              {installed?.instance.value && (
                <Section padding>
                  <ClipSettings
                    id={extension.id}
                    instance={installed.instance.value}
                  />
                </Section>
              )}
              <Menu>
                <ViewAppAction />
                {renderer && <RestartClipAction instance={renderer} />}
                {extension.installed && (
                  <UninstallClipAction extension={extension} />
                )}
                {extension.installed && <ReportIssueAction />}
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
              alignment="center"
              blockSize={raw`2.5rem`}
              inlineSize={raw`2.5rem`}
            >
              <Icon source="app" />
            </View>
            <BlockStack>
              <Text emphasis accessibilityRole="heading">
                {name}
              </Text>
              <Text emphasis="subdued" size="small">
                from app <Text emphasis>{app.name}</Text>
              </Text>
            </BlockStack>
          </Layout>
        </ContentAction>

        {renderer && <ClipInstanceRenderer renderer={renderer} />}
      </BlockStack>
    </Section>
  );
}

function ViewAppAction() {
  return (
    <Action
      icon="arrowEnd"
      onPress={() => alert('App page not implemented yet!')}
    >
      View app
    </Action>
  );
}

function RestartClipAction({
  instance,
}: {
  instance: ClipsExtensionPointInstance<any>;
}) {
  return (
    <Action icon="sync" onPress={() => instance.restart()}>
      Restart
    </Action>
  );
}

function UninstallClipAction({
  extension,
}: {
  extension: ClipsExtensionPoint<any>;
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

function ReportIssueAction() {
  return (
    <Action
      icon="message"
      onPress={() => alert('Reporting not implemented yet!')}
    >
      Report an issue
    </Action>
  );
}

function ClipInstanceRenderer<Point extends ExtensionPoint>({
  renderer,
}: {
  renderer: ClipsExtensionPointInstance<Point>;
}) {
  const instance = renderer.instance.value;

  useEffect(() => {
    renderer.start();

    return () => {
      renderer.stop();
    };
  }, [renderer]);

  const receiver = instance?.receiver;
  const components = instance?.context.components;

  const controller = useMemo(
    () => components && createController(components),
    [components],
  );

  const instanceState = instance?.state.value;
  const isRendered = instanceState === 'rendered';

  const lastRendered = useRef<{
    receiver?: NonNullable<typeof instance>['receiver'];
    controller?: NonNullable<typeof controller>;
  }>({});

  if (isRendered) {
    lastRendered.current.receiver = receiver;
    lastRendered.current.controller = controller;
  }

  const {receiver: lastRenderedReceiver, controller: lastRenderedController} =
    lastRendered.current;

  const resolvedController = isRendered
    ? controller
    : lastRenderedController ?? controller;

  const resolvedReceiver = isRendered
    ? receiver
    : lastRenderedReceiver ?? receiver;

  const restarting = receiver !== resolvedReceiver;

  return resolvedController && resolvedReceiver ? (
    <Section
      className={classes(styles.Content, restarting && styles.restarting)}
    >
      <RemoteRenderer
        controller={resolvedController}
        receiver={resolvedReceiver}
      />
    </Section>
  ) : null;
}
