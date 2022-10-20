import {Pressable} from '@lemon/zest';

import styles from './ResourceAction.module.css';

export function ResourceAction({children}: {children: any}) {
  return (
    <Pressable inlineAlignment="start" className={styles.ResourceAction}>
      {children}&nbsp;<span className={styles.Indicator}>&rarr;</span>
    </Pressable>
  );
}

export function TextAction({children}: {children: any}) {
  return (
    <Pressable inlineAlignment="start" className={styles.ResourceAction}>
      {children}&nbsp;<span className={styles.Indicator}>&rarr;</span>
    </Pressable>
  );
}

export function HeadingAction({children}: {children: any}) {
  return (
    <Pressable inlineAlignment="start" className={styles.ResourceAction}>
      {children}&nbsp;<span className={styles.Indicator}>&rarr;</span>
    </Pressable>
  );
}
