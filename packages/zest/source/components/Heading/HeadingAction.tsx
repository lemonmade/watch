import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {Icon} from '../Icon';
import {Pressable, type PressableProps} from '../Pressable';
import systemStyles from '../../system.module.css';

import {type HeadingProps} from './Heading';
import {useHeadingDomDetails} from './shared';

import styles from './HeadingAction.module.css';
import headingStyles from './Heading.module.css';

export interface HeadingActionProps
  extends Pick<HeadingProps, 'level' | 'accessibilityRole'>,
    Pick<
      PressableProps,
      'to' | 'onPress' | 'perform' | 'postPerform' | 'modal' | 'popover'
    > {}

export function HeadingAction({
  level: explicitLevel,
  children,
  accessibilityRole,
  ...pressableProps
}: PropsWithChildren<HeadingActionProps>) {
  const {level, Element} = useHeadingDomDetails({
    level: explicitLevel,
    accessibilityRole,
  });

  return (
    <div
      className={classes(
        systemStyles.displayInlineFlex,
        styles.HeadingAction,
        styles[`level${explicitLevel ?? level}`],
      )}
    >
      <Pressable
        {...pressableProps}
        inlineAlignment="start"
        className={styles.Pressable}
      >
        <Element
          className={classes(
            headingStyles.Heading,
            headingStyles[`level${explicitLevel ?? level}`],
          )}
        >
          <div className={styles.Icon}>
            <Icon source="more" />
          </div>
          {children}
        </Element>
      </Pressable>
    </div>
  );
}
