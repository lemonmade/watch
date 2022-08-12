import {Button} from './Button';
import {Text} from './Text';
import {View} from './View';

export type {ButtonProps} from './Button';
export type {TextProps} from './Text';
export type {ViewProps} from './View';

export interface Components {
  Text: typeof Text;
  View: typeof View;
  Button: typeof Button;
}

export type AnyComponent = Components[keyof Components];

export {Button, Text, View};
