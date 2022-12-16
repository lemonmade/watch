import {useRef, isValidElement, Children} from 'react';
import {createPortal} from 'react-dom';
import type {
  ReactNode,
  FunctionComponent,
  ReactElement,
  ReactPortal,
} from 'react';
import type {RemoteComponentType, RemoteFragment} from '@remote-ui/core';

import {useRenderContext} from '../context';

export type ReactPropsFromRemoteComponentType<
  Type extends RemoteComponentType<string, any, any>,
> = (Type extends RemoteComponentType<string, infer Props, any>
  ? Props extends Record<string, never>
    ? {}
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
  [Prop in keyof Props]-?: NonNullable<Props[Prop]> extends
    | string
    | RemoteFragment<any>
    ? Prop
    : never;
}[keyof Props];

const EMPTY_SET = new Set<any>();

export function createRemoteReactComponent<
  Type extends string,
  Props extends {} = {},
  AllowedChildren extends RemoteComponentType<string, any> | boolean = true,
>(
  ComponentType: Type | RemoteComponentType<Type, Props, AllowedChildren>,
  {
    fragmentProps: providedFragmentProps,
    privateListeners = true,
  }: {
    fragmentProps?: readonly FragmentProps<Props>[];
    privateListeners?: boolean;
  } = {},
): ReactComponentTypeFromRemoteComponentType<
  RemoteComponentType<Type, Props, AllowedChildren>
> {
  const hasFragmentProps =
    providedFragmentProps && providedFragmentProps.length > 0;
  const fragmentProps = hasFragmentProps
    ? new Set(providedFragmentProps)
    : EMPTY_SET;

  function Component(props: Props) {
    const normalizedProps =
      hasFragmentProps || privateListeners
        ? // eslint-disable-next-line react-hooks/rules-of-hooks
          useNormalizedProps(props, fragmentProps, privateListeners)
        : props;

    // @ts-expect-error we fake this component as being a "native" component.
    return <ComponentType {...normalizedProps} />;
  }

  Component.type = ComponentType;
  Component.displayName = `React(${ComponentType})`;

  return Component as any;
}

function useNormalizedProps<Props extends {}>(
  props: Props,
  fragmentProps: Set<string>,
  privateListeners: boolean,
): Props {
  const context = useRenderContext();

  const fragmentsByProp =
    useRef<Map<string, {element: Element; fragment: RemoteFragment<any>}>>();

  const newProps: Record<string, unknown> = {};
  const portals: ReactPortal[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;

    if (key[0] === 'o' && key[1] === 'n' && privateListeners) {
      newProps[`_${key}`] = value;
      continue;
    }

    if (
      !fragmentProps.has(key) ||
      typeof value !== 'object' ||
      !isValidElement(value)
    ) {
      newProps[key] = value;
      continue;
    }

    let currentFragment = fragmentsByProp.current?.get(key);

    if (currentFragment == null) {
      const fragment = context.root.createFragment();
      const element = context.dom.createFragmentElement(fragment);
      document.append(element);
      currentFragment = {fragment, element};
      fragmentsByProp.current ??= new Map();
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
