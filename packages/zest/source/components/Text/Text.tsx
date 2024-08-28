import type {RenderableProps} from 'preact';
import {classes, variation} from '@lemon/css';

import {useHeadingDomDetails} from '../Heading.tsx';

import styles from './Text.module.css';

export interface TextProps {
  className?: string;
  size?: 'small.2' | 'small.1' | 'small' | 'base';
  emphasis?: boolean | 'strong' | 'subdued';
  accessibilityRole?: 'code' | 'heading';
  /** @see https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric */
  numericVariant?: 'tabular-numbers';
  /** @see https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform */
  transform?: 'uppercase';
}

export function Text(props: RenderableProps<TextProps>) {
  const {children, accessibilityRole} = props;

  if (accessibilityRole === 'heading') {
    return <TextAsHeading {...props} />;
  }

  return <span className={classes(classesForText(props))}>{children}</span>;
}

function TextAsHeading(
  props: Omit<RenderableProps<TextProps>, 'accessibilityRole'>,
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
  transform,
  numericVariant,
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
    transform && styles[variation('transform', transform)],
    numericVariant === 'tabular-numbers' && styles.tabularNumbers,
    className,
  ];
}
