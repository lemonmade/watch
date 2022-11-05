import {useRef, isValidElement, Children} from 'react';
import {createPortal} from 'react-dom';
import type {
  ReactNode,
  FunctionComponent,
  ReactElement,
  ReactPortal,
} from 'react';
import type {RemoteComponentType, RemoteFragment} from '@remote-ui/core';
import {
  createFragmentElement,
  getRemoteNodeForElement,
} from '@watching/clips-dom';

import {useRenderContext} from '../context';

export type ReactPropsFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = (Type extends RemoteComponentType<string, infer Props, any>
  ? Props extends Record<string, never>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        [K in keyof Props]: RemoteFragment<any> extends Props[K]
          ? Props[K] extends infer Other | RemoteFragment<infer R>
            ? Other | ReactElement | false | RemoteFragment<R>
            : Props[K]
          : Props[K];
      }
  : never) & {
  children?: ReactNode;
};

export type ReactComponentTypeFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = FunctionComponent<ReactPropsFromRemoteComponentType<Type>> & {
  readonly type: Type;
};

export type FragmentProps<Props> = {
  [Prop in keyof Props]-?: Required<Props[Prop]> extends
    | string
    | RemoteFragment<any>
    ? Prop
    : never;
}[keyof Props];

// TODO: implement fragment props, like @remote-ui/react
export function createRemoteReactComponent<
  Type extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props = {},
  AllowedChildren extends RemoteComponentType<string, any> | boolean = true,
>(
  ComponentType: Type | RemoteComponentType<Type, Props, AllowedChildren>,
  {
    fragmentProps: providedFragmentProps,
  }: {fragmentProps?: readonly FragmentProps<Props>[]} = {},
): ReactComponentTypeFromRemoteComponentType<
  RemoteComponentType<Type, Props, AllowedChildren>
> {
  const fragmentProps =
    providedFragmentProps && providedFragmentProps.length > 0
      ? new Set(providedFragmentProps)
      : undefined;

  function Component(props: Props) {
    const normalizedProps = fragmentProps
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        usePropsWithFragments(props, fragmentProps as Set<string>)
      : props;

    // @ts-expect-error we fake this component as being a "native" component.
    return <ComponentType {...normalizedProps} />;
  }

  Component.type = ComponentType;
  Component.displayName = `React(${ComponentType})`;

  return Component as any;
}

function usePropsWithFragments<Props>(
  props: Props,
  fragmentProps: Set<string>,
): Props {
  const context = useRenderContext();

  const fragmentsByProp =
    useRef<Map<string, {element: Element; fragment: RemoteFragment<any>}>>();
  fragmentsByProp.current ??= new Map();

  const newProps: Record<string, unknown> = {};
  const portals: ReactPortal[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    if (
      !fragmentProps.has(key) ||
      typeof value !== 'object' ||
      !isValidElement(value)
    ) {
      newProps[key] = value;
      continue;
    }

    let currentFragment = fragmentsByProp.current.get(key);

    if (currentFragment == null) {
      const element = createFragmentElement(context.root);
      const fragment = getRemoteNodeForElement(element) as any;
      currentFragment = {fragment, element};
      document.append(element);
      fragmentsByProp.current.set(key, currentFragment);
    }

    const {element, fragment} = currentFragment;

    portals.push(createPortal(value, element));
    newProps[key] = fragment;
  }

  const existingChildren = (props as any).children;
  if (portals.length > 0) {
    newProps.children = existingChildren
      ? [...Children.toArray(existingChildren), ...portals]
      : portals;
  } else {
    newProps.children = existingChildren;
  }

  return newProps as Props;
}
