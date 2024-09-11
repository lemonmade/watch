import type {ComponentType, PropsWithChildren} from 'react';
import type {RemoteElement} from '@remote-dom/core/elements';
import type {ClipsElement} from '@watching/clips/elements';

export type RemoteComponentPropsFromElement<Type extends Element> =
  PropsWithChildren<
    {slot?: string} & Type extends ClipsElement<infer Attributes, infer _Events>
      ? Partial<Attributes>
      : Type extends RemoteElement<
            infer Properties,
            infer _Methods,
            infer _Slots,
            infer _EventListeners
          >
        ? Partial<Properties>
        : {}
  >;

export type RemoteComponentTypeFromElement<Type extends Element> =
  ComponentType<RemoteComponentPropsFromElement<Type>>;

export function createRemoteComponent<
  Tag extends keyof HTMLElementTagNameMap,
  ElementType extends Element = HTMLElementTagNameMap[Tag],
>(Tag: Tag): RemoteComponentTypeFromElement<ElementType> {
  const RemoteComponent: RemoteComponentTypeFromElement<ElementType> =
    function RemoteComponent(
      props: RemoteComponentPropsFromElement<ElementType>,
    ) {
      // @ts-expect-error I can’t make the types work :/
      return <Tag {...props} />;
    };

  RemoteComponent.displayName = `RemoteComponent(${Tag})`;

  return RemoteComponent;
}
