import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';

import {Icon} from '../Icon/Icon.tsx';
import {Pressable, type PressableProps} from '../Pressable/Pressable.tsx';

import systemStyles from '../../system.module.css';

import {type HeadingProps} from './Heading.tsx';
import {useHeadingDomDetails} from './shared.ts';

import styles from './HeadingAction.module.css';
import headingStyles from './Heading.module.css';

export interface HeadingActionProps
  extends Pick<HeadingProps, 'level' | 'accessibilityRole'>,
    Pick<
      PressableProps,
      'to' | 'onPress' | 'perform' | 'postPerform' | 'overlay'
    > {}

export function HeadingAction({
  level: explicitLevel,
  children,
  accessibilityRole,
  ...pressableProps
}: RenderableProps<HeadingActionProps>) {
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
