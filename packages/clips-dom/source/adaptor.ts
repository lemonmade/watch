import {
  type RemoteComponentType,
  type PropsForRemoteComponent,
} from '@remote-ui/core';
import {type HTMLConstructorForRemoteComponent} from './components';
import {CHANNEL} from './dom/constants';

export interface HTMLAdaptorForRemoteComponent<
  Type extends RemoteComponentType<any, any, any>,
> {
  readonly type: Type;
  getElementConstructor(): HTMLConstructorForRemoteComponent<Type>;
}

export function createRemoteHTMLAdaptor<
  Type extends RemoteComponentType<any, any, any>,
>(
  type: Type,
  {
    properties = [],
  }: {properties?: (keyof PropsForRemoteComponent<Type>)[]} = {},
): HTMLAdaptorForRemoteComponent<Type> {
  let Element: HTMLConstructorForRemoteComponent<Type>;

  return {
    type,
    getElementConstructor() {
      // We lazily instantiate this because we may not install the HTMLElement
      // browser global until later.
      Element ??= class RemoteElement extends HTMLElement {
        static readonly remote = type;

        constructor() {
          super();

          for (const property of properties) {
            let value: any;

            Reflect.defineProperty(this, property, {
              enumerable: true,
              configurable: true,
              get() {
                return value;
              },
              set(this: RemoteElement, newValue: any) {
                if (newValue !== value) {
                  value = newValue;
                  const channel = (this as any)[CHANNEL];
                  channel?.setProperty(this as any, name, value);
                }
              },
            });
          }
        }
      } as any;

      return Element;
    },
  };
}
