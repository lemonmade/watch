import htm from 'htm/mini';
import type {AnyElement} from '@watching/clips';

const ALLOWED_ELEMENTS = new Map<AnyElement, Record<string, any>>([
  ['ui-stack', {spacing: Boolean}],
  ['ui-inline-stack', {spacing: Boolean}],
  ['ui-block-stack', {spacing: Boolean}],
  ['ui-skeleton-text', {size: String}],
  ['ui-skeleton-text-block', {lines: Number}],
  ['ui-skeleton-button', {}],
  ['ui-skeleton-view', {}],
]);

const PROPERTY_CONVERTER_MAP = new Map<any, (value: any) => any>([
  [Boolean, (value) => (typeof value === 'boolean' ? value : value === '')],
  [Number, (value) => (typeof value === 'number' ? value : Number(value))],
]);

class LoadingElement {
  readonly properties: Record<string, unknown>;

  constructor(
    readonly type: string,
    properties: Record<string, unknown> | null | undefined,
    readonly children: readonly (string | LoadingElement)[],
  ) {
    const allowedProperties = ALLOWED_ELEMENTS.get(type as any);

    if (allowedProperties == null) {
      throw new Error(`Unrecognized element: ${type}`);
    }

    const normalizedProperties: Record<string, any> = {};

    for (const [property, value] of Object.entries(properties ?? {})) {
      if (allowedProperties[property] == null) {
        throw new Error(
          `Unrecognized property on element ${type}: ${property}`,
        );
      }

      const converter =
        PROPERTY_CONVERTER_MAP.get(allowedProperties[property]) ??
        ((value) => value);

      normalizedProperties[property] = converter(value);
    }

    this.type = type;
    this.properties = normalizedProperties;
    this.children = children;
  }

  get innerHTML() {
    let propertiesString = '';

    for (const [property, value] of Object.entries(this.properties)) {
      if (value === true) {
        propertiesString += ` ${property}`;
      } else if (typeof value === 'string' || typeof value === 'number') {
        propertiesString += ` ${property}="${value}"`;
      }
    }

    return `<${this.type}${propertiesString}>${serializeLoadingHtml(
      this.children,
    )}</${this.type}>`;
  }
}

export const html = htm.bind<LoadingElement | string>(
  (type, props, ...children) => {
    return new LoadingElement(type, props, children);
  },
);

export function parseLoadingHtml(content: string) {
  const templateArray: any = [content];
  templateArray.raw = [content];
  const elements = html(templateArray);
  return Array.isArray(elements) ? elements : [elements];
}

export function serializeLoadingHtml(
  elements: string | LoadingElement | readonly (string | LoadingElement)[],
) {
  const list: readonly (string | LoadingElement)[] = Array.isArray(elements)
    ? elements
    : [elements];

  let serialized = '';

  for (const element of list) {
    if (typeof element === 'string') {
      serialized += element;
    } else {
      serialized += element.innerHTML;
    }
  }

  return serialized;
}
