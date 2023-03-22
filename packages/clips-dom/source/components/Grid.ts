import {
  Grid as BaseGrid,
  type GridProps,
  BlockGrid as BaseBlockGrid,
  InlineGrid as BaseInlineGrid,
} from '@watching/clips';
import {
  createRemoteDOMComponent,
  type HTMLElementForRemoteComponent,
} from './shared';
import {VIEW_PROPERTIES} from './View';

export const GRID_NON_DIRECTIONAL_PROPERTIES: Exclude<
  keyof GridProps,
  'direction' | 'blockSizes' | 'inlineSizes'
>[] = [
  'spacing',
  'inlineAlignment',
  'blockAlignment',
  'layoutMode',
  ...VIEW_PROPERTIES,
];

export const Grid = 'ui-grid';

export const GridComponent = createRemoteDOMComponent(BaseGrid, {
  properties: [
    'direction',
    'blockSizes',
    'inlineSizes',
    ...GRID_NON_DIRECTIONAL_PROPERTIES,
  ],
});

export type UIGridElement = HTMLElementForRemoteComponent<typeof BaseGrid>;

export const BlockGrid = 'ui-block-grid';

export const BlockGridComponent = createRemoteDOMComponent(BaseBlockGrid, {
  properties: ['sizes', ...GRID_NON_DIRECTIONAL_PROPERTIES],
});

export type UIBlockGridElement = HTMLElementForRemoteComponent<
  typeof BaseBlockGrid
>;

export const InlineGrid = 'ui-inline-grid';

export const InlineGridComponent = createRemoteDOMComponent(BaseInlineGrid, {
  properties: ['sizes', ...GRID_NON_DIRECTIONAL_PROPERTIES],
});

export type UIInlineGridElement = HTMLElementForRemoteComponent<
  typeof BaseInlineGrid
>;
