import type {PropsWithChildren} from 'react';
import {classes, variation} from '@lemon/css';

import {useUniqueId} from '../../utilities/id';

import styles from './Layout.css';

export type Size = 'auto' | 'fill' | 'hidden' | false | number;
export type ViewportSize = 'small' | 'medium' | 'large';

export interface ViewportMedia {
  readonly min?: ViewportSize;
  readonly max?: ViewportSize;
}

export interface Media<T> {
  readonly value: T;
  readonly viewport?: ViewportMedia;
}

export type ValueOrMediaList<T> = T | Media<T>[];

interface Props {
  inlineAlignment?: 'leading' | 'trailing';
  blockAlignment?: 'center' | 'trailing';
  sizes?: ValueOrMediaList<Size[]>;
}

// In ems, need to make configurable
const MEDIAQUERY_MAP: Map<ViewportSize, number> = new Map([
  ['small', 32],
  ['medium', 50],
  ['large', 70],
]);

export function Layout({
  inlineAlignment,
  blockAlignment,
  sizes = ['auto'],
  children,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Layout');

  const className = classes(
    styles.Layout,
    blockAlignment && styles[variation('blockAlignment', blockAlignment)],
    inlineAlignment && styles[variation('inlineAlignment', inlineAlignment)],
  );

  return (
    <>
      <SizesStyles scope={id} sizes={sizes} />
      <div id={id} className={className}>
        {children}
      </div>
    </>
  );
}

function SizesStyles({
  scope,
  sizes,
}: {
  scope: string;
  sizes: NonNullable<Props['sizes']>;
}) {
  const rootSelector = `#${scope}`;

  return (
    <style>
      {Array.from(normalizeMaybeMediaList(sizes))
        .map(({viewport, value}) =>
          viewport
            ? wrapViewportMedia(viewport, sizesToSelectors(rootSelector, value))
            : sizesToSelectors(rootSelector, value),
        )
        .join('\n')}
    </style>
  );
}

function wrapViewportMedia({min, max}: ViewportMedia, content: string) {
  let selector: string;

  const minEms = min && getMinimum(min);
  const maxEms = max && getMaximum(max);

  if (!minEms && !maxEms) {
    return content;
  }

  if (minEms && maxEms) {
    selector = `(min-width: ${minEms}em, max-width: ${maxEms}em)`;
  } else if (maxEms) {
    selector = `(max-width: ${maxEms}em)`;
  } else {
    selector = `(min-width: ${minEms}em)`;
  }

  return `@media all and ${selector} {\n${content}\n}`;
}

function getMinimum(value: ViewportSize) {
  switch (value) {
    case 'small':
      return 0;
    case 'medium':
      return MEDIAQUERY_MAP.get('small')!;
    case 'large':
      return MEDIAQUERY_MAP.get('medium')!;
  }
}

function getMaximum(value: ViewportSize) {
  return MEDIAQUERY_MAP.get(value)! - 0.001;
}

function sizesToSelectors(root: string, sizes: Size[]) {
  const hiddenChildren: number[] = [];
  const columns: string[] = [];

  sizes.forEach((size, index) => {
    if (size) {
      switch (size) {
        case 'auto': {
          columns.push('auto');
          break;
        }
        case 'fill': {
          columns.push('1fr');
          break;
        }
        case 'hidden': {
          hiddenChildren.push(index);
          break;
        }
        default: {
          columns.push(`${size}px`);
        }
      }
    } else {
      hiddenChildren.push(index);
    }
  });

  let content = `${root} { grid-template-columns: ${columns.join(
    ' ',
  )}; }\n${root} > :nth-child(n + 1) { --x-implicit-display: initial; } `;

  if (hiddenChildren.length) {
    content += `\n${hiddenChildren
      .map((hiddenIndex) => `${root} > :nth-child(${hiddenIndex + 1})`)
      .join(', ')} { --x-implicit-display: none; }`;
  }

  return content;
}

function* normalizeMaybeMediaList<T>(maybeMediaList: ValueOrMediaList<T>) {
  if (Array.isArray(maybeMediaList)) {
    if (maybeMediaList.length === 0) return;
    if (typeof maybeMediaList[0] === 'object' && 'value' in maybeMediaList[0]) {
      yield* (maybeMediaList as Media<T>[])[Symbol.iterator]();
    } else {
      yield {value: maybeMediaList as any} as Media<T>;
    }
  } else {
    yield {value: maybeMediaList} as Media<T>;
  }
}
