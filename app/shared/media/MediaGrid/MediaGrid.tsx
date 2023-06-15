import {type ReactNode, type PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';
import {
  Pressable,
  View,
  CSSLiteral,
  type CSSLiteralValue,
  type PressableProps,
  Popover,
} from '@lemon/zest';

import styles from './MediaGrid.module.css';

interface Props {
  blockSpacing?: 'base' | 'large';
  minInlineSize?: CSSLiteralValue;
}

export function MediaGrid({
  children,
  blockSpacing,
  minInlineSize,
}: PropsWithChildren<Props>) {
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
  image?: ReactNode;
  menu?: ReactNode;
}

export function MediaGridItem({
  to,
  image,
  menu,
  children,
}: PropsWithChildren<MediaGridItemProps>) {
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

  const baseProps = {
    className: classes(styles.MediaGridItem, hasImage && styles.hasImage),
    inlineAlignment: 'start',
  } as const;

  return actionProps ? (
    <Pressable {...baseProps} {...actionProps}>
      {image}
      {children}
    </Pressable>
  ) : (
    <View {...baseProps}>
      {image}
      {children}
    </View>
  );
}
