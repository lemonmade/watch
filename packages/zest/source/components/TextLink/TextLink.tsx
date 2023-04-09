import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {Pressable, type PressableProps} from '../Pressable.tsx';

import styles from './TextLink.module.css';

export interface TextLinkProps extends Pick<PressableProps, 'id' | 'target'> {
  to: NonNullable<PressableProps['to']>;
  size?: 'small' | 'base';
  emphasis?: boolean | 'strong' | 'subdued';
}

export function TextLink({
  id,
  to,
  target,
  size,
  emphasis,
  children,
}: PropsWithChildren<TextLinkProps>) {
  return (
    <Pressable
      id={id}
      to={to}
      target={target}
      className={classes(
        styles.TextLink,
        size && styles[variation('size', size)],
        emphasis &&
          styles[
            variation(
              'emphasis',
              typeof emphasis === 'boolean' ? 'strong' : emphasis,
            )
          ],
        emphasis === 'strong' && styles.strong,
      )}
    >
      {children}
    </Pressable>
  );
}
