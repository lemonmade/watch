import {REMOTE_PROPERTIES} from '../constants.ts';
import {updateNodeRemoteProperty} from '../remote.ts';

export interface RemoteElementProperties {
  [key: string]: {
    attribute: string | boolean;
  };
}

export class RemoteElement extends HTMLElement {
  static readonly properties: RemoteElementProperties;
  private static readonly attributeToPropertyMap = new Map<string, string>();

  static get observedAttributes() {
    const {properties, attributeToPropertyMap} = this;

    if (properties == null) {
      return [];
    }

    Object.keys(properties).forEach((name) => {
      const {attribute = true} = properties[name]!;

      if (attribute === true) {
        attributeToPropertyMap.set(name.toLowerCase(), name);
      } else if (typeof attribute === 'string') {
        attributeToPropertyMap.set(attribute, name);
      }
    });

    return [...attributeToPropertyMap.keys()];
  }

  private [REMOTE_PROPERTIES]!: Record<string, unknown>;

  constructor() {
    super();

    const {properties} = this.constructor as typeof RemoteElement;

    Object.defineProperty(this, REMOTE_PROPERTIES, {
      value: {},
      writable: true,
      configurable: true,
      enumerable: false,
    });

    if (properties) {
      Object.keys(properties).forEach((name) => {
        Object.defineProperty(this, name, {
          configurable: true,
          enumerable: true,
          get: () => {
            return this[REMOTE_PROPERTIES][name];
          },
          set: (value) => {
            this[REMOTE_PROPERTIES][name] = value;
            updateNodeRemoteProperty(this, name, value);
          },
        });
      });
    }
  }

  attributeChangedCallback(key: string, _oldValue: any, newValue: any) {
    const property = (
      this.constructor as typeof RemoteElement
    ).attributeToPropertyMap.get(key)!;

    (this as any)[property] = newValue;
  }
}
