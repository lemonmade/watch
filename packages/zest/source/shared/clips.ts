import {type ElementConstructors} from '@watching/clips';
import {
  type RemoteComponentPropsFromElementConstructor,
  type RemoteComponentTypeFromElementConstructor,
} from '@lemonmade/remote-ui-react';

export type ReactComponentPropsForClipsElement<
  Element extends keyof ElementConstructors,
> = RemoteComponentPropsFromElementConstructor<ElementConstructors[Element]>;

export type ReactComponentTypeForClipsElement<
  Element extends keyof ElementConstructors,
> = RemoteComponentTypeFromElementConstructor<ElementConstructors[Element]>;
