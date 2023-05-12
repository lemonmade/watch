import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';
import type {
  DynamicValue,
  ViewportSizeKeyword,
  ValueFromStyleDynamicValue,
  AlignmentKeyword,
  GridProperties as BaseGridProps,
  BlockGridProperties as BaseBlockGridProps,
  InlineGridProperties as BaseInlineGridProps,
  ViewportCondition,
} from '@watching/clips';

import systemStyles from '../../system.module.css';
import {CSSLiteral, DynamicStyle, type SpacingKeyword} from '../../system.ts';
import {SPACING_CLASS_MAP} from '../../styles/spacing.ts';
import {useUniqueId} from '../../shared/id.ts';

import {useViewProps, resolveViewProps, type ViewProps} from '../View.tsx';

import styles from './Grid.module.css';

export interface GridProps
  extends BaseGridProps,
    Omit<
      ViewProps,
      | 'padding'
      | 'paddingInlineStart'
      | 'paddingInlineEnd'
      | 'paddingBlockStart'
      | 'paddingBlockEnd'
      | 'inlineAlignment'
      | 'blockAlignment'
    > {}

export interface BlockGridProps
  extends Omit<GridProps, 'direction' | 'blockSizes' | 'inlineSizes'>,
    Pick<BaseBlockGridProps, 'sizes'> {}

export interface InlineGridProps
  extends Omit<GridProps, 'direction' | 'blockSizes' | 'inlineSizes'>,
    Pick<BaseInlineGridProps, 'sizes'> {}

const INLINE_ALIGNMENT_CLASS_MAP = new Map<AlignmentKeyword, string | false>([
  ['start', styles.inlineAlignmentStart],
  ['center', styles.inlineAlignmentCenter],
  ['end', styles.inlineAlignmentEnd],
  ['stretch', styles.inlineAlignmentStretch],
  ['spaceBetween', styles.inlineAlignmentSpaceBetween],
] as [AlignmentKeyword, string][]);

const BLOCK_ALIGNMENT_CLASS_MAP = new Map<AlignmentKeyword, string | false>([
  ['start', styles.blockAlignmentStart],
  ['center', styles.blockAlignmentCenter],
  ['end', styles.blockAlignmentEnd],
  ['stretch', styles.blockAlignmentStretch],
  ['spaceBetween', styles.blockAlignmentSpaceBetween],
] as [AlignmentKeyword, string][]);

const MEDIA_QUERY_MAXIMUM_EM_REDUCTION = 0.01;
const MEDIA_QUERIES = {
  small: 0,
  medium: 32,
  large: 50,
};

const MEDIA_QUERY_MAP: Map<
  ViewportSizeKeyword,
  [`${number}em`?, `${number}em`?]
> = new Map([
  [
    'small',
    [undefined, `${MEDIA_QUERIES.medium - MEDIA_QUERY_MAXIMUM_EM_REDUCTION}em`],
  ],
  [
    'medium',
    [
      `${MEDIA_QUERIES.medium}em`,
      `${MEDIA_QUERIES.large - MEDIA_QUERY_MAXIMUM_EM_REDUCTION}em`,
    ],
  ],
  ['large', [`${MEDIA_QUERIES.large}em`, undefined]],
]);

export function Grid({
  inlineSizes,
  blockSizes,
  ...props
}: PropsWithChildren<GridProps>) {
  const grid = useGridProps(props);
  const id = useUniqueId('Grid');

  return (
    <>
      <GridSizesStyles id={id} inline={inlineSizes} block={blockSizes} />
      <div {...resolveViewProps(grid)} id={id}>
        {props.children}
      </div>
    </>
  );
}

export function BlockGrid({
  sizes,
  ...props
}: PropsWithChildren<BlockGridProps>) {
  const grid = useGridProps({...props, blockSizes: sizes});
  const id = useUniqueId('BlockGrid');

  return (
    <>
      <GridSizesStyles id={id} block={sizes} />
      <div {...resolveViewProps(grid)} id={id}>
        {props.children}
      </div>
    </>
  );
}

export function InlineGrid({
  sizes,
  ...props
}: PropsWithChildren<InlineGridProps>) {
  const grid = useGridProps({
    ...props,
    inlineSizes: sizes,
    direction: 'inline',
  });
  const id = useUniqueId('InlineGrid');

  return (
    <>
      <GridSizesStyles id={id} inline={sizes} />
      <div {...resolveViewProps(grid)} id={id}>
        {props.children}
      </div>
    </>
  );
}

export {resolveViewProps as resolveGridProps};

export function useGridProps({
  spacing,
  blockSizes,
  inlineSizes,
  direction = blockSizes != null && inlineSizes == null ? 'block' : 'inline',
  inlineAlignment,
  blockAlignment,
  ...systemProps
}: GridProps) {
  const view = useViewProps({...systemProps, display: 'grid'});
  view.addClassName(
    styles.Grid,
    blockAlignment && styles[variation('blockAlignment', blockAlignment)],
    inlineAlignment && styles[variation('inlineAlignment', inlineAlignment)],
    spacing && SPACING_CLASS_MAP.get(spacing),
  );

  if (direction) {
    view.addClassName(styles[variation('direction', direction)]);
  }

  if (spacing != null) {
    let normalizedSpacing: SpacingKeyword;

    if (typeof spacing === 'boolean') {
      normalizedSpacing = spacing ? 'base' : 'none';
    } else {
      normalizedSpacing = spacing;
    }

    const systemClassName = SPACING_CLASS_MAP.get(normalizedSpacing);

    view.addClassName(systemClassName);
  }

  if (inlineAlignment) {
    view.addClassName(
      INLINE_ALIGNMENT_CLASS_MAP.get(inlineAlignment),
      (inlineAlignment == null || inlineAlignment === 'stretch') &&
        (direction == null || direction === 'block')
        ? systemStyles.contentInlineSizeFill
        : undefined,
    );
  }

  if (
    (inlineAlignment == null || inlineAlignment === 'stretch') &&
    direction === 'block'
  ) {
    view.addClassName(systemStyles.contentInlineSizeFill);
  }

  if (blockAlignment) {
    view.addClassName(BLOCK_ALIGNMENT_CLASS_MAP.get(blockAlignment));
  }

  return view;
}

function GridSizesStyles({
  id,
  inline,
  block,
}: {
  id: string;
  inline?: GridProps['inlineSizes'];
  block?: GridProps['blockSizes'];
}) {
  const gridRules = createGridRules(`#${id}`, inline, block);

  return <style>{gridRules.join('\n')}</style>;
}

function createGridRules(
  selector: string,
  inline?: GridProps['inlineSizes'],
  block?: GridProps['blockSizes'],
) {
  const rules: string[] = [];

  if (block) {
    const rows: string[] = [];

    const blockWithConditions: DynamicValue<
      ValueFromStyleDynamicValue<GridProps['blockSizes']>
    >[] = [];

    if (DynamicStyle.test(block)) {
      blockWithConditions.push(DynamicStyle.parse(block));
    } else {
      blockWithConditions.push({value: block});
    }

    for (const {value: block, viewport} of blockWithConditions) {
      let mediaQueryPrefix = '';
      let mediaQueryPostfix = '';

      if (viewport) {
        mediaQueryPrefix = mediaQueryPrefixFromViewportCondition(viewport);
        mediaQueryPostfix = mediaQueryPrefix ? ' }' : '';
      }

      for (const [index, size] of block.entries()) {
        if (!size || size === 'hidden') {
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: none; }${mediaQueryPostfix}`,
          );
          continue;
        }

        if (size === 'auto') {
          rows.push('auto');
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: initial; --z-implicit-display-flex: initial; --z-implicit-display-grid: initial; --z-internal-container-inline-size: initial; }${mediaQueryPostfix}`,
          );
        } else if (size === 'fill') {
          rows.push('minmax(0, 1fr)');
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: 100%; }${mediaQueryPostfix}`,
          );
        } else if (CSSLiteral.test(size)) {
          rows.push(CSSLiteral.parse(size));
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: initial; }${mediaQueryPostfix}`,
          );
        }
      }

      if (rows.length) {
        rules.push(
          `${mediaQueryPrefix}${selector} { grid-template-rows: ${rows.join(
            ' ',
          )}; }${mediaQueryPostfix}`,
        );
      }
    }
  }

  if (inline) {
    const columns: string[] = [];

    const inlineWithConditions: DynamicValue<
      ValueFromStyleDynamicValue<GridProps['inlineSizes']>
    >[] = [];

    if (DynamicStyle.test(inline)) {
      inlineWithConditions.push(DynamicStyle.parse(inline));
    } else {
      inlineWithConditions.push({value: inline});
    }

    for (const {value: inline, viewport} of inlineWithConditions) {
      let mediaQueryPrefix = '';
      let mediaQueryPostfix = '';

      if (viewport) {
        mediaQueryPrefix = mediaQueryPrefixFromViewportCondition(viewport);
        mediaQueryPostfix = mediaQueryPrefix ? ' }' : '';
      }

      for (const [index, size] of inline.entries()) {
        if (!size || size === 'hidden') {
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: none; }`,
          );
          continue;
        }

        if (size === 'auto') {
          columns.push('auto');
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: initial; --z-implicit-display-flex: initial; --z-implicit-display-grid: initial; --z-internal-container-inline-size: initial; }${mediaQueryPostfix}`,
          );
        } else if (size === 'fill') {
          columns.push('minmax(0, 1fr)');
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: 100%; }${mediaQueryPostfix}`,
          );
        } else if (CSSLiteral.test(size)) {
          columns.push(CSSLiteral.parse(size));
          rules.push(
            `${mediaQueryPrefix}:where(${selector}) > :where(:nth-child(${
              index + 1
            })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: 100%; }${mediaQueryPostfix}`,
          );
        }
      }

      if (columns.length) {
        rules.push(
          `${mediaQueryPrefix}${selector} { grid-template-columns: ${columns.join(
            ' ',
          )}; }${mediaQueryPostfix}`,
        );
      }
    }
  }

  return rules;
}

function mediaQueryPrefixFromViewportCondition(viewport?: ViewportCondition) {
  if (viewport == null) return '';

  let minWidthCondition: string | undefined;
  let maxWidthCondition: string | undefined;

  if (viewport.min) {
    const namedViewportSizes = MEDIA_QUERY_MAP.get(viewport.min);

    if (namedViewportSizes) {
      const namedMinimumViewportSize = namedViewportSizes[0];

      if (namedMinimumViewportSize) {
        minWidthCondition = namedMinimumViewportSize;
      }
    } else if (CSSLiteral.test(viewport.min)) {
      minWidthCondition = CSSLiteral.parse(viewport.min);
    }
  }

  if (viewport.max) {
    const namedViewportSizes = MEDIA_QUERY_MAP.get(viewport.max);

    if (namedViewportSizes) {
      const namedMaximumViewportSize = namedViewportSizes[1];

      if (namedMaximumViewportSize) {
        maxWidthCondition = namedMaximumViewportSize;
      }
    } else if (CSSLiteral.test(viewport.max)) {
      maxWidthCondition = CSSLiteral.parse(viewport.max);
    }
  }

  if (!minWidthCondition && !maxWidthCondition) return '';

  if (minWidthCondition && maxWidthCondition) {
    return `@media (min-width: ${minWidthCondition}, max-width: ${maxWidthCondition}) {`;
  } else if (maxWidthCondition) {
    return `@media (max-width: ${maxWidthCondition}) {`;
  } else {
    return `@media (min-width: ${minWidthCondition}) {`;
  }
}
