import {createRemoteComponent} from '@remote-ui/core';

export interface TextBlockProps {}

/**
 * TextBlock wraps a block of text content.
 */
export const TextBlock = createRemoteComponent<'TextBlock', TextBlockProps>(
  'TextBlock',
);
