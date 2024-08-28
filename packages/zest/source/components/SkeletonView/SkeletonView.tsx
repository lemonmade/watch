import type {RenderableProps} from 'preact';

import {type PreactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonViewProps =
  PreactComponentPropsForClipsElement<'ui-skeleton-view'>;

export function SkeletonView({children}: RenderableProps<SkeletonViewProps>) {
  return <div>{children}</div>;
}
