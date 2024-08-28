import {classes} from '@lemon/css';

import {Overlay} from '../Overlay.tsx';
import {HeadingLevelReset} from '../Heading.tsx';

import {ActionScopeReset} from '../../shared/actions.tsx';
import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

import systemStyles from '../../system.module.css';

import styles from './Modal.module.css';

export type ModalProps = PreactComponentPropsForClipsElement<'ui-modal'>;

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
