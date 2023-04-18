import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {useHeadingDomDetails} from '../Heading.tsx';

import styles from './Text.module.css';

export interface TextProps {
  className?: string;
  size?: 'small.2' | 'small.1' | 'small' | 'base';
  emphasis?: boolean | 'strong' | 'subdued';
  accessibilityRole?: 'code' | 'heading';
}

export function Text(props: PropsWithChildren<TextProps>) {
  const {children, accessibilityRole} = props;

  if (accessibilityRole === 'heading') {
    return <TextAsHeading {...props} />;
  }

  return <span className={classes(classesForText(props))}>{children}</span>;
}

function TextAsHeading(
  props: Omit<PropsWithChildren<TextProps>, 'accessibilityRole'>,
) {
  const {children} = props;
  const {Element} = useHeadingDomDetails();

  return (
    <Element className={classes(classesForText(props))}>{children}</Element>
  );
}

const SIZE_CLASS_MAP = new Map<TextProps['size'], string | undefined>([
  ['small.2', styles.sizeSmall2],
  ['small.1', styles.sizeSmall1],
  ['small', styles.sizeSmall1],
]);

function classesForText({
  size,
  emphasis,
  accessibilityRole,
  className,
}: TextProps) {
  return [
    styles.Text,
    SIZE_CLASS_MAP.get(size),
    emphasis &&
      styles[
        variation(
          'emphasis',
          typeof emphasis === 'boolean' ? 'strong' : emphasis,
        )
      ],
    accessibilityRole === 'code' && styles.code,
    className,
  ];
}
