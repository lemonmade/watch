import {createRemoteComponent} from '@remote-ui/core';
import type {SpacingValue} from '../shared';

export interface InlineStackProps {
  spacing?: SpacingValue | boolean;
}

export const InlineStack = createRemoteComponent<
  'InlineStack',
  InlineStackProps
>('InlineStack');
