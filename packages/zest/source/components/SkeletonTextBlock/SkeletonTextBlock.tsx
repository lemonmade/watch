import type {RenderableProps} from 'preact';
import {useMemo} from 'preact/hooks';

import type {SkeletonTextBlockProperties} from '@watching/clips';

import {Style} from '../../system.ts';
import {SkeletonText} from '../SkeletonText/SkeletonText.tsx';
import {useStackProps, resolveStackProps} from '../Stack/Stack.tsx';

export interface SkeletonTextBlockProps
  extends Partial<SkeletonTextBlockProperties> {}

export function SkeletonTextBlock({
  lines = 3,
}: RenderableProps<SkeletonTextBlockProps>) {
  const stack = useStackProps({direction: 'block'});

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
        <SkeletonText key={`${index}${size}`} size={size} />
      ))}
    </p>
  );
}
