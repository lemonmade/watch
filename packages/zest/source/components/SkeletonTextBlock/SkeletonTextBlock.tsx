import {useMemo, type PropsWithChildren} from 'react';

import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';
import {Style} from '../../system.ts';
import {useStackProps, resolveStackProps} from '../Stack.tsx';
import {SkeletonText} from '../SkeletonText.tsx';

export type SkeletonTextBlockProps =
  ReactComponentPropsForClipsElement<'ui-skeleton-text-block'>;

export function SkeletonTextBlock({
  lines = 3,
}: PropsWithChildren<SkeletonTextBlockProps>) {
  const stack = useStackProps({
    spacing: 'small.1',
    direction: 'block',
    paddingBlockStart: 'small.2',
  });

  const lineSizes = useMemo(() => {
    // create an array of line sizes, where the first line is 90% of the width,
    // and subsequent lines are a random amount between 85% and 95%
    const sizes: ReturnType<typeof Style.css>[] = [];

    for (let i = 0; i < lines; i++) {
      sizes.push(
        Style.css`${Math.round(
          Math.random() * 10 + (i === lines - 1 ? 35 : 85),
        )}%`,
      );
    }

    return sizes;
  }, [lines]);

  return (
    <p {...resolveStackProps(stack)}>
      {lineSizes.map((size, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonText key={`${index}${size}`} size={size} />
      ))}
    </p>
  );
}
