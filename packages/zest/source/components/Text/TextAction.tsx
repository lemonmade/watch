import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';

import {Icon} from '../Icon.tsx';
import {Pressable, type PressableProps} from '../Pressable.tsx';

import systemStyles from '../../system.module.css';

import {Text, type TextProps} from './Text.tsx';

import styles from './TextAction.module.css';

export interface TextActionProps
  extends Pick<TextProps, 'emphasis' | 'accessibilityRole'>,
    Pick<
      PressableProps,
      'to' | 'onPress' | 'perform' | 'postPerform' | 'overlay'
    > {}

export function TextAction({
  children,
  emphasis,
  accessibilityRole,
  ...pressableProps
}: RenderableProps<TextActionProps>) {
  return (
    <div className={classes(systemStyles.displayInlineFlex, styles.TextAction)}>
      <Pressable
        {...pressableProps}
        inlineAlignment="start"
        className={styles.Pressable}
      >
        <div className={styles.Icon}>
          <Icon source="more" />
        </div>
        <Text emphasis={emphasis} accessibilityRole={accessibilityRole}>
          {children}
        </Text>
      </Pressable>
    </div>
  );
}
