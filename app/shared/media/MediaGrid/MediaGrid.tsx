import type {ComponentChild, RenderableProps} from 'preact';
import {classes, variation} from '@lemon/css';
import {
  Text,
  Pressable,
  View,
  CSSLiteral,
  Popover,
  BlockStack,
  type CSSLiteralValue,
  type PressableProps,
} from '@lemon/zest';

import styles from './MediaGrid.module.css';

interface Props {
  blockSpacing?: 'auto' | 'large';
  minInlineSize?: CSSLiteralValue;
}

export function MediaGrid({
  children,
  blockSpacing,
  minInlineSize,
}: RenderableProps<Props>) {
  const style = minInlineSize
    ? ({
        '--w-internal-MediaGrid-item-min-inline-size':
          CSSLiteral.parse(minInlineSize),
      } as any)
    : undefined;

  return (
    <div
      style={style}
      className={classes(
        styles.MediaGrid,
        blockSpacing && styles[variation('blockSpacing', blockSpacing)],
      )}
    >
      {children}
    </div>
  );
}

export interface MediaGridItemProps {
  to?: PressableProps['to'];
  image?: ComponentChild;
  menu?: ComponentChild;
  title?: ComponentChild;
  subtitle?: ComponentChild;
}

export function MediaGridItem({
  to,
  image,
  menu,
  title,
  subtitle,
  children,
}: RenderableProps<MediaGridItemProps>) {
  const hasImage = Boolean(image);

  let actionProps: PressableProps | undefined;

  if (to) {
    actionProps ??= {};
    actionProps.to = to;
  }

  if (menu) {
    actionProps ??= {};
    actionProps.overlay = <Popover inlineAttachment="end">{menu}</Popover>;
  }

  let titleContent: ComponentChild = null;

  if (title || subtitle) {
    titleContent = (
      <BlockStack padding="small" spacing="small.2">
        {title && <Text emphasis>{title}</Text>}
        {subtitle && (
          <Text emphasis="subdued" size="small.2">
            {subtitle}
          </Text>
        )}
      </BlockStack>
    );
  }

  const baseProps = {
    className: classes(styles.MediaGridItem, hasImage && styles.hasImage),
    inlineAlignment: 'start',
  } as const;

  return actionProps ? (
    <Pressable {...baseProps} {...actionProps}>
      {image}
      {titleContent}
      {children}
    </Pressable>
  ) : (
    <View {...baseProps}>
      {image}
      {titleContent}
      {children}
    </View>
  );
}
