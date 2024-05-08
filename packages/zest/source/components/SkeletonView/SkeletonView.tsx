import type {RenderableProps} from 'preact';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonViewProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-view'>;

export function SkeletonView({children}: RenderableProps<SkeletonViewProps>) {
  return <div>{children}</div>;
}
