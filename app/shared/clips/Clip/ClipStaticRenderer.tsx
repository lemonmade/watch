import type {ComponentChild, ComponentType} from 'preact';

import {SPACING_KEYWORDS} from '@watching/design';
import type {Elements} from '@watching/clips';

import {
  Stack as UIStack,
  BlockStack as UIBlockStack,
  InlineStack as UIInlineStack,
  SkeletonButton as UISkeletonButton,
  SkeletonText as UISkeletonText,
  SkeletonTextBlock as UISkeletonTextBlock,
  SkeletonView as UISkeletonView,
} from '@lemon/zest';
import {useMemo} from 'react';

export type StaticRenderComponent<T extends Element = Element> = ComponentType<{
  element: T;
}>;

const Stack = createStaticRenderComponent(
  'ui-stack',
  function Stack({element, ...props}) {
    return (
      <UIStack
        spacing={restrictToAllowedValues(
          element.getAttribute('spacing'),
          SPACING_KEYWORDS,
        )}
        {...props}
      />
    );
  },
);

const BlockStack = createStaticRenderComponent(
  'ui-block-stack',
  function BlockStack({element, ...props}) {
    return (
      <UIBlockStack
        spacing={restrictToAllowedValues(
          element.getAttribute('spacing'),
          SPACING_KEYWORDS,
        )}
        {...element.attributes}
        {...props}
      />
    );
  },
);

const InlineStack = createStaticRenderComponent(
  'ui-inline-stack',
  function InlineStack({element, ...props}) {
    return (
      <UIInlineStack
        spacing={restrictToAllowedValues(
          element.getAttribute('spacing'),
          SPACING_KEYWORDS,
        )}
        {...element.attributes}
        {...props}
      />
    );
  },
);

const SkeletonButton = createStaticRenderComponent(
  'ui-skeleton-button',
  function SkeletonButton({element, ...props}) {
    return <UISkeletonButton {...element.attributes} {...props} />;
  },
);

const SkeletonText = createStaticRenderComponent(
  'ui-skeleton-text',
  function SkeletonText({element, ...props}) {
    return <UISkeletonText {...element.attributes} {...props} />;
  },
);

const SkeletonTextBlock = createStaticRenderComponent(
  'ui-skeleton-text-block',
  function SkeletonTextBlock({element, ...props}) {
    const lines = element.getAttribute('lines');
    const parsedLines = lines
      ? Number.parseInt(lines, 10) || undefined
      : undefined;
    return <UISkeletonTextBlock lines={parsedLines} {...props} />;
  },
);

const SkeletonView = createStaticRenderComponent(
  'ui-skeleton-view',
  function SkeletonView({element, ...props}) {
    return <UISkeletonView {...element.attributes} {...props} />;
  },
);

const LOADING_COMPONENT_MAP = new Map<string, StaticRenderComponent<any>>([
  ['ui-stack', Stack],
  ['ui-block-stack', BlockStack],
  ['ui-inline-stack', InlineStack],
  ['ui-skeleton-button', SkeletonButton],
  ['ui-skeleton-text', SkeletonText],
  ['ui-skeleton-text-block', SkeletonTextBlock],
  ['ui-skeleton-view', SkeletonView],
]);

export function ClipStaticRenderer({content}: {content: string}) {
  const rendered = useMemo(() => {
    const template = document.createElement('template');
    template.innerHTML = content;

    const rendered: ComponentChild[] = [];

    let index = 0;
    let child = template.content.firstChild;

    while (child != null) {
      rendered.push(renderNode(child, {key: index}));
      index += 1;
      child = child.nextSibling;
    }

    return <>{rendered}</>;
  }, [content]);

  return rendered;
}

function renderNode(node: Node, {key}: {key: any}) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const localName = element.localName;

  const Component = LOADING_COMPONENT_MAP.get(localName);

  if (Component == null) {
    throw new Error(`Unknown loading component: ${localName}`);
  }

  return (
    <Component key={key} element={element}>
      {Array.from(element.childNodes).map((child, index) =>
        renderNode(child, {key: index}),
      )}
    </Component>
  );
}

function createStaticRenderComponent<Tag extends keyof Elements>(
  tag: Tag,
  Component: StaticRenderComponent<Element>,
) {
  Component.displayName = `ClipsStaticRenderer(${tag})`;
  return Component;
}

function isAllowedValue<T extends string>(
  value: string | null | undefined,
  allowed: Set<T>,
): value is T {
  return value != null && allowed.has(value as T);
}

function restrictToAllowedValues<T extends string>(
  value: string | null | undefined,
  allowed: Set<T>,
): T | undefined {
  if (isAllowedValue(value, allowed)) return value as T;
}
