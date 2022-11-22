import {classes} from '@lemon/css';

import {HeadingLevelReset} from '../Heading';
import {ActionScopeReset} from '../../utilities/actions';
import {type PropsForClipsComponent} from '../../utilities/clips';

import systemStyles from '../../system.module.css';

import {Overlay} from '../Overlay';

import styles from './Modal.module.css';

type ModalProps = PropsForClipsComponent<'Modal'>;

export function Modal({children, padding}: ModalProps) {
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
