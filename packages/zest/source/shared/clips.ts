import {type ElementConstructors} from '@watching/clips';
import {
  type RemoteComponentPropsFromElementConstructor,
  type RemoteComponentTypeFromElementConstructor,
} from '@remote-dom/preact';

export type PreactComponentPropsForClipsElement<
  Element extends keyof ElementConstructors,
> = RemoteComponentPropsFromElementConstructor<ElementConstructors[Element]>;

export type PreactComponentTypeForClipsElement<
  Element extends keyof ElementConstructors,
> = RemoteComponentTypeFromElementConstructor<ElementConstructors[Element]>;
