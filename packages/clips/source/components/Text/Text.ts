import {createRemoteComponent} from '@remote-ui/core';

export interface TextProps {}

/**
 * Text is used to visually style and provide semantic value for a small piece of text
 * content.
 */
export const Text = createRemoteComponent<'Text', TextProps>('Text');
