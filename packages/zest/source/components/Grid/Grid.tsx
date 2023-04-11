import type {PropsWithChildren} from 'react';
import {variation} from '@lemon/css';
import type {
  AlignmentKeyword,
  GridProps as BaseGridProps,
  BlockGridProps as BaseBlockGridProps,
  InlineGridProps as BaseInlineGridProps,
} from '@watching/clips';

import systemStyles from '../../system.module.css';
import {type SpacingKeyword} from '../../system';
import {SPACING_CLASS_MAP} from '../../styles/spacing';
import {useUniqueId} from '../../shared/id.ts';

import {useViewProps, resolveViewProps, type ViewProps} from '../View';

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
  direction,
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
    (direction == null || direction === 'block')
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

    for (const [index, size] of block.entries()) {
      if (!size || size === 'hidden') {
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: none; }`,
        );
        continue;
      }

      // if (raw.test(size)) {
      //   rows.push(raw.parse(size));
      //   rules.push(
      //     `:where(${selector}) > :where(:nth-child(${
      //       index + 1
      //     })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: initial; }`,
      //   );
      // } else
      if (size === 'auto') {
        rows.push('auto');
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: initial; --z-internal-display-block: initial; --z-implicit-display-flex: initial; --z-implicit-display-grid: initial; --z-internal-container-inline-size: initial; }`,
        );
      } else if (size === 'fill') {
        rows.push('minmax(0, 1fr)');
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: 100%; }`,
        );
      }
    }

    if (rows.length) {
      rules.push(`${selector} { grid-template-rows: ${rows.join(' ')}; }`);
    }
  }

  if (inline) {
    const columns: string[] = [];

    for (const [index, size] of inline.entries()) {
      if (!size || size === 'hidden') {
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: none; }`,
        );
        continue;
      }

      // if (raw.test(size)) {
      //   columns.push(raw.parse(size));
      //   rules.push(
      //     `:where(${selector}) > :where(:nth-child(${
      //       index + 1
      //     })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: initial; }`,
      //   );
      // } else
      if (size === 'auto') {
        columns.push('auto');
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: initial; --z-internal-display-block: initial; --z-implicit-display-flex: initial; --z-implicit-display-grid: initial; --z-internal-container-inline-size: initial; }`,
        );
      } else if (size === 'fill') {
        columns.push('minmax(0, 1fr)');
        rules.push(
          `:where(${selector}) > :where(:nth-child(${
            index + 1
          })) { --z-internal-display-none: initial; --z-internal-display-block: block; --z-internal-display-flex: flex; --z-internal-display-grid: grid; --z-internal-container-inline-size: 100%; }`,
        );
      }
    }

    if (columns.length) {
      rules.push(
        `${selector} { grid-template-columns: ${columns.join(' ')}; }`,
      );
    }
  }

  return rules;
}
