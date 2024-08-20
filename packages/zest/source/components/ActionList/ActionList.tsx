import {classes} from '@lemon/css';
import type {RenderableProps} from 'preact';

import systemStyles from '../../system.module.css';

import styles from './ActionList.module.css';

export interface ActionListProps {}

export function ActionList({children}: RenderableProps<ActionListProps>) {
  return (
    <div
      className={classes(
        systemStyles.contentInlineSizeFill,
        systemStyles.inlineAlignmentStart,
        styles.ActionList,
      )}
    >
      {children}
    </div>
  );
}
