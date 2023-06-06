import type {PropsWithChildren} from 'react';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonViewProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-view'>;

export function SkeletonView({children}: PropsWithChildren<SkeletonViewProps>) {
  return <div>{children}</div>;
}
