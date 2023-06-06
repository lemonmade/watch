import type {PropsWithChildren} from 'react';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonTextBlockProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-text-block'>;

export function SkeletonTextBlock({
  lines,
}: PropsWithChildren<SkeletonTextBlockProps>) {
  return (
    <p>skeleton text block{lines == null ? null : ` (lines: ${lines})`}</p>
  );
}
