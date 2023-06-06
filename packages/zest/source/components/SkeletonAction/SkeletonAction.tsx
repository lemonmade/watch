import type {PropsWithChildren} from 'react';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

export type SkeletonActionProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-action'>;

export function SkeletonAction(_: PropsWithChildren<SkeletonActionProps>) {
  return <span>skeleton action</span>;
}
