import type {RenderableProps} from './types';

// eslint-disable-next-line @typescript-eslint/ban-types
export function Fragment(props: RenderableProps<{}>) {
  return props.children;
}
