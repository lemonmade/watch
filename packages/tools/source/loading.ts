import type {HTMLElement} from 'node-html-parser';
import type {AnyElement} from '@watching/clips';

const ALLOWED_ELEMENTS = new Map<AnyElement, Record<string, any>>([
  ['ui-stack', {spacing: Boolean}],
  ['ui-inline-stack', {spacing: Boolean}],
  ['ui-block-stack', {spacing: Boolean}],
  ['ui-skeleton-text', {size: String}],
  ['ui-skeleton-text-block', {lines: Number}],
  ['ui-skeleton-action', {}],
]);

export async function sanitizeLoadingUi(content: string) {
  const [{minify}, {parse}] = await Promise.all([
    import('html-minifier-terser'),
    import('node-html-parser'),
  ]);

  const parsed = parse(content);

  sanitizeElement(parsed);

  return minify(parsed.innerHTML, {
    collapseWhitespace: true,
  });
}

function sanitizeElement(element: HTMLElement) {
  const {tagName, attributes, childNodes} = element;
  const allowedAttributes = tagName
    ? ALLOWED_ELEMENTS.get(tagName.toLowerCase() as any)
    : undefined;

  if (tagName != null && allowedAttributes == null) {
    throw new Error(`Unrecognized element: ${element.localName}`);
  }

  if (allowedAttributes) {
    Object.entries(attributes).forEach(([attribute]) => {
      if (allowedAttributes[attribute] == null) {
        throw new Error(
          `Unrecognized attribute on element ${element.localName}: ${attribute}`,
        );
      }
    });
  }

  for (const child of childNodes) {
    if (child.nodeType === 1) {
      sanitizeElement(child as HTMLElement);
    }
  }
}
