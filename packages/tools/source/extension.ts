import {parse as parseHTML} from 'node-html-parser';
import {parse as parseGraphQL} from 'graphql';
import {toGraphQLOperation, cleanGraphQLDocument} from '@quilted/graphql-tools';
import type {AnyElement, ExtensionPoint} from '@watching/clips';

export const ALLOWED_EXTENSION_POINTS = new Set<ExtensionPoint>([
  'series.details.accessory',
  'watch-through.details.accessory',
]);

export function validateExtensionPoint(
  extensionPoint: unknown,
): extensionPoint is ExtensionPoint {
  return ALLOWED_EXTENSION_POINTS.has(extensionPoint as any);
}

// TODO: actually validate it against a GraphQL schema
export async function validateAndNormalizeLiveQuery(query: string) {
  const ast = parseGraphQL(query);
  const cleaned = cleanGraphQLDocument(ast);
  const operation = toGraphQLOperation(cleaned);
  return operation.source;
}

const ALLOWED_LOADING_ELEMENTS = new Map<AnyElement, Record<string, any>>([
  ['ui-stack', {spacing: Boolean}],
  ['ui-inline-stack', {spacing: Boolean}],
  ['ui-block-stack', {spacing: Boolean}],
  ['ui-skeleton-text', {size: String}],
  ['ui-skeleton-text-block', {lines: Number}],
  ['ui-skeleton-button', {}],
  ['ui-skeleton-view', {}],
]);

export async function validateAndNormalizeLoadingUI(ui: string) {
  const html = parseHTML(ui);

  // TODO: more validation
  for (const element of html.querySelectorAll('*')) {
    const localName = element.localName;

    if (!ALLOWED_LOADING_ELEMENTS.has(localName as any)) {
      throw new Error(`Unknown loading element: ${localName}`);
    }
  }

  return html.innerHTML;
}
