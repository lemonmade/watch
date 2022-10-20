import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {Icon} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';
import systemStyles from '../../system.module.css';

import {Text, type TextProps} from './Text';

import styles from './TextAction.module.css';

export interface TextActionProps
  extends Pick<TextProps, 'emphasis' | 'accessibilityRole'>,
    Pick<
      PressableProps,
      'to' | 'onPress' | 'perform' | 'postPerform' | 'modal' | 'popover'
    > {}

export function TextAction({
  children,
  emphasis,
  accessibilityRole,
  ...pressableProps
}: PropsWithChildren<TextActionProps>) {
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
