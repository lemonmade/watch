import {useEffect, useRef} from 'preact/hooks';

import {type ExtensionPoint} from '@watching/clips';
import {RemoteRootRenderer} from '@remote-dom/preact/host';
import {
  Style,
  Popover,
  BlockStack,
  InlineGrid,
  View,
  Text,
  Menu,
  ContentAction,
  Icon,
  Button,
  Section,
} from '@lemon/zest';
import {classes} from '@lemon/css';
import type {ThreadRendererInstance} from '@watching/thread-render';

import {useGraphQLMutation} from '~/shared/graphql.ts';

import {
  ClipsExtensionPointBeingRenderedContext,
  useClipsExtensionPointBeingRendered,
} from '../context.ts';
import {
  ClipsExtensionPointRenderer,
  type ClipsExtensionPoint,
  type ClipsExtensionPointInstanceContext,
} from '../extension.ts';

import {ClipSettings} from './ClipSettings.tsx';
import {ClipStaticRenderer} from './ClipStaticRenderer.tsx';

import styles from './Clip.module.css';
import uninstallClipsExtensionFromClipMutation from './graphql/UninstallClipsExtensionFromClipMutation.graphql';

export interface ClipProps<Point extends ExtensionPoint> {
  extensionPoint: ClipsExtensionPoint<Point>;
}

export function Clip<Point extends ExtensionPoint>({
  extensionPoint,
}: ClipProps<Point>) {
  const {name, app} = extensionPoint.extension;
  const renderer =
    extensionPoint.installed?.renderer ?? extensionPoint.local?.renderer;

  return (
    <ClipsExtensionPointBeingRenderedContext.Provider value={extensionPoint}>
      <Section>
        <BlockStack spacing>
          <ContentAction
            overlay={
              <Popover inlineAttachment="start">
                {extensionPoint.installed && (
                  <Section padding>
                    <ClipSettings />
                  </Section>
                )}
                <Menu>
                  <ViewAppAction />
                  {renderer && <RestartClipButton renderer={renderer} />}
                  {extensionPoint.installed && <UninstallClipButton />}
                  {extensionPoint.installed && <ReportIssueButton />}
                </Menu>
              </Popover>
            }
          >
            <InlineGrid sizes={['auto', 'fill']} spacing="small">
              <View
                display="inlineFlex"
                background="emphasized"
                border="subdued"
                cornerRadius
                alignment="center"
                blockSize={Style.css`2.5rem`}
                inlineSize={Style.css`2.5rem`}
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
            </InlineGrid>
          </ContentAction>

          {renderer && <ClipInstanceRenderer renderer={renderer} />}
        </BlockStack>
      </Section>
    </ClipsExtensionPointBeingRenderedContext.Provider>
  );
}

function ViewAppAction() {
  return (
    <Button
      icon="arrow.end"
      onPress={() => alert('App page not implemented yet!')}
    >
      View app
    </Button>
  );
}

function RestartClipButton({
  renderer,
}: {
  renderer: ClipsExtensionPointRenderer<any>;
}) {
  return (
    <Button icon="sync" onPress={() => renderer.restart()}>
      Restart
    </Button>
  );
}

function UninstallClipButton() {
  const extensionPoint = useClipsExtensionPointBeingRendered();

  const uninstallClipsExtensionFromClip = useGraphQLMutation(
    uninstallClipsExtensionFromClipMutation,
  );

  const {id} = extensionPoint.installation;

  return (
    <Button
      icon="delete"
      onPress={async () => {
        await uninstallClipsExtensionFromClip.run({id});
      }}
    >
      Uninstall
    </Button>
  );
}

function ReportIssueButton() {
  return (
    <Button
      icon="message"
      onPress={() => alert('Reporting not implemented yet!')}
    >
      Report an issue
    </Button>
  );
}

function ClipInstanceRenderer<Point extends ExtensionPoint>({
  renderer,
}: {
  renderer: ClipsExtensionPointRenderer<Point>;
}) {
  const {instance} = renderer;

  useEffect(() => {
    renderer.start();

    return () => {
      renderer.stop();
    };
  }, [renderer]);

  const receiver = instance?.receiver;
  const components = instance?.context.components;

  const instanceState = instance?.state.value;
  const isRendered = instanceState === 'rendered';

  const lastRendered = useRef<NonNullable<typeof instance>['receiver']>();

  if (isRendered) {
    lastRendered.current = receiver;
  }

  const lastRenderedReceiver = lastRendered.current;

  const resolvedReceiver = isRendered
    ? receiver
    : (lastRenderedReceiver ?? receiver);

  const restarting = receiver !== resolvedReceiver;

  const Renderer = RemoteRootRenderer as any;

  return lastRenderedReceiver != null && resolvedReceiver && components ? (
    <Section
      className={classes(styles.Content, restarting && styles.restarting)}
    >
      <Renderer components={components} receiver={resolvedReceiver} />
    </Section>
  ) : (
    <ClipsInstanceRendererLoading instance={instance} />
  );
}

function ClipsInstanceRendererLoading<Point extends ExtensionPoint>({
  instance,
}: {
  instance?: ThreadRendererInstance<ClipsExtensionPointInstanceContext<Point>>;
}) {
  const loadingUi = instance?.context.loadingUi.value;

  if (loadingUi == null) return null;

  return <ClipStaticRenderer content={loadingUi} />;
}
