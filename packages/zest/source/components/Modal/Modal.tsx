import type {RenderableProps} from 'preact';
import {classes} from '@lemon/css';
import type {ModalProperties} from '@watching/clips';

import {Overlay} from '../Overlay/Overlay.tsx';
import {HeadingLevelReset} from '../Heading/Heading.tsx';

import {ActionScopeReset} from '../../shared/actions.tsx';

import systemStyles from '../../system.module.css';

import styles from './Modal.module.css';

export interface ModalProps extends Omit<Partial<ModalProperties>, 'padding'> {
  padding?: ModalProperties['padding'] | boolean;
}

export function Modal({children, padding}: RenderableProps<ModalProps>) {
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
