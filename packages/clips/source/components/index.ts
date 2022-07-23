import {Text} from './Text';
import {View} from './View';

export type {TextProps} from './Text';
export type {ViewProps} from './View';

export interface Components {
  Text: typeof Text;
  View: typeof View;
}

export type AnyComponent = Components[keyof Components];

export {Text, View};
