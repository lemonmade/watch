import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {useDomProps, Keyword, toProps} from '../../system';
import type {KeywordValue, SystemProps} from '../../system';
import {useImplicitAction, ariaForTarget} from '../../utilities/actions';

import styles from './Pressable.module.css';

export type Alignment = 'start' | 'center' | 'end';

interface Props extends SystemProps {
  align?: Alignment | KeywordValue<Alignment>;
  onPress?(): void;
}

export function Pressable({
  onPress,
  children,
  align,
  ...systemProps
}: PropsWithChildren<Props>) {
  const dom = useDomProps(systemProps);
  const implicitAction = useImplicitAction();

  if (align) {
    dom.addClassName(
      styles[
        variation('align', Keyword.test(align) ? Keyword.parse(align) : align)
      ],
    );
  }

  return (
    <button
      {...toProps(dom)}
      type="button"
      className={classes(styles.Pressable)}
      onClick={
        (implicitAction ?? onPress) &&
        (() => {
          implicitAction?.perform();
          onPress?.();
        })
      }
      {...ariaForTarget(implicitAction?.target)}
    >
      {children}
    </button>
  );
}
