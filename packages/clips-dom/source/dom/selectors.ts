import {CHILD, NEXT, PARENT, PREV, NodeType} from './constants';
import type {Node} from './Node';
import type {Element} from './Element';

const enum Combinator {
  Descendant,
  Child,
  Sibling,
  Adjacent,
  Inner,
}

const enum MatcherType {
  Unknown,
  Id,
  Class,
  Attribute,
  Pseudo,
  Function,
}

interface Part {
  combinator: Combinator;
  matchers: Matcher[];
}

interface Matcher {
  type: MatcherType;
  name: string;
  value?: string;
}

export function querySelector(within: Element, selector: string) {
  const parts = parseSelector(selector);
  let result: Element | null = null;

  const child = within[CHILD];
  if (child && parts[0]!.matchers.length) {
    walkNodesForSelector(child, parts, (node) => {
      result = node;
      return false;
    });
  }
  return result;
}

export function querySelectorAll(within: Element, selector: string) {
  const parts = parseSelector(selector);
  const results: Element[] = [];

  const child = within[CHILD];
  if (child && parts[0]!.matchers.length) {
    walkNodesForSelector(child, parts, (node) => {
      results.push(node);
    });
  }
  return results;
}

export function parseSelector(selector: string) {
  let part: Part = {combinator: Combinator.Inner, matchers: []};
  const parts = [part];
  const tokenizer =
    /\s*?([>\s+~]?)\s*?(?:(?:\[\s*([^\]=]+)(?:=(['"])(.*?)\3)?\s*\])|([#.])([^\s#.[>:]+)|:(\w+)(?:\((.*?)\))?)/gi;
  let token;
  while ((token = tokenizer.exec(selector))) {
    // [1]: ancestor/parent/sibling/adjacent
    // [2]: attribute name
    // [4]: attribute value
    // [5]: id/class sigil
    // [6]: id/class name
    // [7]: :pseudo/:function() name
    // [8]: :function(argument) value
    if (token[1]) {
      // Update the combinator on the (now parent) Part:
      if (token[1] === '>') part.combinator = Combinator.Child;
      else if (token[1] === '+') part.combinator = Combinator.Adjacent;
      else if (token[1] === '~') part.combinator = Combinator.Sibling;
      else part.combinator = Combinator.Descendant;
      // Add a new Part for the next selector parts:
      part = {combinator: Combinator.Inner, matchers: []};
      parts.push(part);
    }

    let type = MatcherType.Unknown;
    if (token[2]) {
      type = MatcherType.Attribute;
    } else if (token[5]) {
      type = token[5] === '#' ? MatcherType.Id : MatcherType.Class;
    } else if (token[7]) {
      type = token[8] == null ? MatcherType.Pseudo : MatcherType.Function;
    }
    part.matchers.push({
      type,
      name: (token[2] || token[6] || token[7])!,
      value: token[4] ?? token[6] ?? token[8],
    });
  }
  return parts;
}

function matchesSelector(element: Element, selector: string) {
  const parsed = parseSelector(selector);
  let part: Part | undefined;
  while ((part = parsed.pop())) {
    if (!matchesSelectorPart(element, part)) return false;
  }
  // let part = parsed.pop();
  // if (!part || !matchesSelectorPart(element, part)) {
  //   return false;
  // }
  // while ((part = parsed.pop())) {
  //   if (!matchesSelectorPart(element, part)) return false;
  // }
  return true;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

function walkNodesForSelector(
  node: Node,
  parts: Part[],
  callback: (node: Element) => boolean | void,
) {
  if (isElementNode(node)) {
    if (matchesSelectorRecursive(node, parts)) {
      if (callback(node) === false) return false;
    }
    const child = node[CHILD];
    if (child && walkNodesForSelector(child, parts, callback) === false) {
      return false;
    }
  }
  const next = node[NEXT];
  if (next && walkNodesForSelector(next, parts, callback) === false) {
    return false;
  }
  return true;
}

function matchesSelectorRecursive(element: Element, parts: Part[]): boolean {
  const {combinator, matchers} = parts[parts.length - 1]!;
  if (combinator === Combinator.Inner) {
    if (!matchesSelectorMatcher(element, matchers)) return false;
    const pp = parts.slice(0, -1);
    return pp.length === 0 || matchesSelectorRecursive(element, pp);
  }
  const link =
    combinator === Combinator.Child || combinator === Combinator.Descendant
      ? PARENT
      : PREV;
  let ref = element[link];
  if (!ref || !matchesSelectorMatcher(ref as Element, matchers)) {
    return false;
  }
  if (
    combinator === Combinator.Descendant ||
    combinator === Combinator.Sibling
  ) {
    while ((ref = ref[link])) {
      if (matchesSelectorMatcher(ref as Element, matchers)) {
        const pp = parts.slice(0, -1);
        if (pp.length === 0) return true;
        if (matchesSelectorRecursive(element, pp)) return true;
      }
    }
  }
  return false;
}

function matchesSelectorPart(element: Element, {combinator, matchers}: Part) {
  if (combinator === Combinator.Inner) {
    return matchesSelectorMatcher(element, matchers);
  }
  const link =
    combinator === Combinator.Child || combinator === Combinator.Descendant
      ? PARENT
      : PREV;
  let ref = element[link];
  if (!ref || !matchesSelectorMatcher(ref as Element, matchers)) {
    return false;
  }
  if (
    combinator === Combinator.Descendant ||
    combinator === Combinator.Sibling
  ) {
    while ((ref = ref[link])) {
      if (matchesSelectorMatcher(ref as Element, matchers)) return true;
    }
  }
  return false;
}

function matchesSelectorMatcher(
  element: Element | null,
  matcher: Matcher | Matcher[],
) {
  if (!element) return false;
  if (Array.isArray(matcher)) {
    for (const single of matcher) {
      if (matchesSelectorMatcher(element, single) === false) return false;
    }
    return true;
  }
  const {type, name, value} = matcher;
  switch (type) {
    // case 'id': case 'class': return element.getAttribute(matcher.type) === matcher.name;
    case MatcherType.Id:
      return element.getAttribute('id') === name;
    case MatcherType.Class:
      return element.getAttribute('class') === name;
    case MatcherType.Attribute:
      return value == null
        ? element.hasAttribute(name)
        : element.getAttribute(name) === value;
    case MatcherType.Pseudo:
      switch (name) {
        default:
          throw Error(`Pseudo :${name} not implemented`);
      }
    case MatcherType.Function:
      switch (name) {
        case 'has':
          return matchesSelector(element, value || '');
        default:
          throw Error(`Function :${name}(${value}) not implemented`);
      }
  }
  return false;
}
