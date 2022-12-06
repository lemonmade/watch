import {
  type RemoteComponentType,
  type PropsForRemoteComponent,
} from '@remote-ui/core';
import {CHANNEL} from '../dom/constants';

export type HTMLElementForRemoteComponent<
  Type extends RemoteComponentType<any, any, any>,
> = HTMLElement & PropsForRemoteComponent<Type>;

export interface HTMLConstructorForRemoteComponent<
  Type extends RemoteComponentType<any, any, any>,
> {
  readonly remote: Type;
  new (): HTMLElementForRemoteComponent<Type>;
}

export interface RemoteDOMComponent<
  Type extends RemoteComponentType<any, any, any>,
> {
  readonly type: Type;
  readonly elementConstructor: HTMLConstructorForRemoteComponent<Type>;
}

export function createRemoteDOMComponent<
  Type extends RemoteComponentType<any, any, any>,
>(
  type: Type,
  {
    properties = [],
    allowPrivateListeners = true,
  }: {
    properties?: (keyof PropsForRemoteComponent<Type>)[];
    allowPrivateListeners?: boolean;
  } = {},
): RemoteDOMComponent<Type> {
  let ElementConstructor: HTMLConstructorForRemoteComponent<Type>;

  return {
    type,
    get elementConstructor() {
      // We lazily instantiate this because we may not install the HTMLElement
      // browser global until later.
      ElementConstructor ??= class RemoteElement extends HTMLElement {
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
                  channel?.setProperty(this as any, property, value);
                }
              },
            });

            if (
              allowPrivateListeners &&
              (property as string)[0] === 'o' &&
              (property as string)[1] === 'n'
            ) {
              Reflect.defineProperty(this, `_${property as string}`, {
                enumerable: true,
                configurable: true,
                get() {
                  return value;
                },
                set(this: RemoteElement, newValue: any) {
                  if (newValue !== value) {
                    value = newValue;
                    const channel = (this as any)[CHANNEL];
                    channel?.setProperty(this as any, property, value);
                  }
                },
              });
            }
          }
        }
      } as any;

      return ElementConstructor;
    },
  };
}
