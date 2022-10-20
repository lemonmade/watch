import {type PropsWithChildren} from 'react';
import {classes} from '@lemon/css';

import {HeadingLevelReset} from '../Heading';
import {ActionScopeReset} from '../../utilities/actions';

import systemStyles from '../../system.module.css';

import {Overlay} from '../Overlay';

import styles from './Modal.module.css';

interface ModalProps {
  padding?: boolean;
}

export function Modal({children, padding}: PropsWithChildren<ModalProps>) {
  return (
    <HeadingLevelReset level={2}>
      <ActionScopeReset>
        <Overlay
          modal
          relativeTo="viewport"
          className={classes(
            systemStyles.resetOrientation,
            styles.Modal,
            padding && styles.padding,
          )}
          inlineAttachment="center"
          blockAttachment="start"
          classNameOpenStart={styles.transitionOpenStart}
          classNameOpenEnd={styles.transitionOpenEnd}
          classNameCloseEnd={styles.transitionCloseEnd}
        >
          {children}
        </Overlay>
      </ActionScopeReset>
    </HeadingLevelReset>
  );
}
