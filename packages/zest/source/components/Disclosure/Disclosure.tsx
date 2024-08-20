import {classes} from '@lemon/css';
import {useSignal} from '@quilted/quilt/signals';

import {useUniqueId} from '../../shared/id.ts';
import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Disclosure.module.css';

export type DisclosureProps =
  PreactComponentPropsForClipsElement<'ui-disclosure'>;

export function Disclosure({label, children}: DisclosureProps) {
  const id = useUniqueId('Disclosure');
  const labelId = `${id}Label`;

  const open = useSignal(false);
  const isOpen = open.value;

  return (
    <div className={classes(styles.Disclosure, isOpen && styles.open)}>
      <button
        type="button"
        id={labelId}
        aria-controls={id}
        aria-expanded={isOpen}
        className={styles.Action}
        onClick={() => {
          open.value = !isOpen;
        }}
      >
        {label}
      </button>
      <div id={id} className={styles.Content} aria-labelledby={labelId}>
        {children}
      </div>
    </div>
  );
}
