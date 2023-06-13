import {classes} from '@lemon/css';
import {useSignal} from '@watching/react-signals';

import {useUniqueId} from '../../shared/id.ts';
import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Disclosure.module.css';

export type DisclosureProps =
  ReactComponentPropsForClipsElement<'ui-disclosure'>;

export function Disclosure({label, children}: DisclosureProps) {
  const open = useSignal(false);
  const id = useUniqueId('Disclosure');
  const labelId = `${id}Label`;

  return (
    <div className={styles.Disclosure}>
      <button
        type="button"
        id={labelId}
        aria-controls={id}
        aria-expanded={open.value}
        className={classes(styles.Action, open.value && styles.open)}
        onClick={() => {
          open.value = !open.value;
        }}
      >
        {label}
      </button>
      <div id={id} aria-labelledby={labelId}>
        {open.value ? children : null}
      </div>
    </div>
  );
}
