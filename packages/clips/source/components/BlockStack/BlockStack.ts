import {createRemoteComponent} from '@remote-ui/core';
import type {SpacingValue} from '../shared';

export interface BlockStackProps {
  spacing?: SpacingValue | boolean;
}

export const BlockStack = createRemoteComponent<'BlockStack', BlockStackProps>(
  'BlockStack',
);
