import type {PropsWithChildren} from 'react';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonTextProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-text'>;

export function SkeletonText(_: PropsWithChildren<SkeletonTextProps>) {
  return <span>skeleton text</span>;
}
