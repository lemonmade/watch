import {SkeletonTextBlock as UISkeletonTextBlock} from '@lemon/zest';
import {createClipsComponentRenderer, useRenderedChildren} from './shared.ts';

export const SkeletonTextBlock = createClipsComponentRenderer(
  'ui-skeleton-text-block',
  function SkeletonTextBlock(props) {
    const {children} = useRenderedChildren(props);

    const attributes = props.element.attributes.value;

    return (
      <UISkeletonTextBlock
        lines={attributes.lines ? Number(attributes.lines) : undefined}
      >
        {children}
      </UISkeletonTextBlock>
    );
  },
);
