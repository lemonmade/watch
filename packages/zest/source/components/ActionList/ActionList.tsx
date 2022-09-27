import {classes} from '@lemon/css';
import {type PropsWithChildren} from 'react';

import systemStyles from '../../system.module.css';

import styles from './ActionList.module.css';

export interface ActionListProps {}

export function ActionList({children}: PropsWithChildren<ActionListProps>) {
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
