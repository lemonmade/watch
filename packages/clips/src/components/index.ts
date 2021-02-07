import {Text} from './Text';
import {View} from './View';

export type {TextProps} from './Text';
export type {ViewProps} from './View';

export type AnyComponent = typeof Text | typeof View;

export {Text, View};
