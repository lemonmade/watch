import type {ComponentType} from 'preact';
import {useEffect, useRef} from 'preact/hooks';

import {type ExtensionPoint} from '@watching/clips';
import {RemoteRootRenderer} from '@remote-dom/preact/host';
import {
  Style,
  Popover,
  Stack,
  InlineStack,
  BlockStack,
  InlineGrid,
  View,
  Text,
  Menu,
  ContentAction,
  Icon,
  Button,
  Section,
  SkeletonButton,
  SkeletonText,
  SkeletonTextBlock,
  SkeletonView,
} from '@lemon/zest';
import {classes} from '@lemon/css';
import type {ThreadRendererInstance} from '@watching/thread-render';

import {useGraphQLMutation} from '~/shared/graphql.ts';

import {useClipsManager} from '../react.tsx';
import {
  type ClipsExtensionPoint,
  type ClipsExtensionPointInstance,
  type ClipsExtensionPointInstanceContext,
  type ClipsExtensionPointInstanceLoadingElement,
} from '../extension.ts';

import {ClipSettings} from './ClipSettings.tsx';

import styles from './Clip.module.css';
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
                {renderer && <RestartClipButton instance={renderer} />}
                {extension.installed && (
                  <UninstallClipButton extension={extension} />
                )}
                {extension.installed && <ReportIssueButton />}
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
  instance,
}: {
  instance: ClipsExtensionPointInstance<any>;
}) {
  return (
    <Button icon="sync" onPress={() => instance.restart()}>
      Restart
    </Button>
  );
}

function UninstallClipButton({
  extension,
}: {
  extension: ClipsExtensionPoint<any>;
}) {
  const uninstallClipsExtensionFromClip = useGraphQLMutation(
    uninstallClipsExtensionFromClipMutation,
  );

  const {id} = extension.extension;

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

  const instanceState = instance?.state.value;
  const isRendered = instanceState === 'rendered';

  const lastRendered = useRef<NonNullable<typeof instance>['receiver']>();

  if (isRendered) {
    lastRendered.current = receiver;
  }

  const lastRenderedReceiver = lastRendered.current;

  const resolvedReceiver = isRendered
    ? receiver
    : lastRenderedReceiver ?? receiver;

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

const LOADING_COMPONENT_MAP = new Map<string, ComponentType<any>>([
  ['ui-stack', Stack],
  ['ui-block-stack', BlockStack],
  ['ui-inline-stack', InlineStack],
  ['ui-skeleton-button', SkeletonButton],
  ['ui-skeleton-text', SkeletonText],
  ['ui-skeleton-text-block', SkeletonTextBlock],
  ['ui-skeleton-view', SkeletonView],
]);

function ClipsInstanceRendererLoading<Point extends ExtensionPoint>({
  instance,
}: {
  instance?: ThreadRendererInstance<ClipsExtensionPointInstanceContext<Point>>;
}) {
  const loadingUi = instance?.context.loadingUi.value;

  if (loadingUi == null) return null;

  const renderNode = (
    child: ClipsExtensionPointInstanceLoadingElement['children'][number],
    index: number,
  ) => {
    if (typeof child === 'string') {
      return <>{child}</>;
    }

    const {type, properties, children} = child;

    const Component = LOADING_COMPONENT_MAP.get(type);

    if (Component == null) {
      throw new Error(`Unknown loading component: ${type}`);
    }

    return (
      <Component key={index} {...properties}>
        {children.map(renderNode)}
      </Component>
    );
  };

  return <>{loadingUi.map(renderNode)}</>;
}
