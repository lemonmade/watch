import {
  cloneElement,
  isValidElement,
  type VNode,
  type RenderableProps,
} from 'preact';

import type {
  Disclosure as DisclosureElement,
  DisclosureProperties,
} from '@watching/clips/elements';

export interface DisclosureProps
  extends RenderableProps<
    Omit<Partial<DisclosureProperties>, 'label'>,
    DisclosureElement
  > {
  label?: VNode<any>;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-disclosure': DisclosureProps;
    }
  }
}

export function Disclosure({label, children, ...props}: DisclosureProps) {
  return label && isValidElement(label) ? (
    <ui-disclosure {...props}>
      {children}
      {cloneElement(label, {slot: 'label'})}
    </ui-disclosure>
  ) : (
    <ui-disclosure label={label} {...props}>
      {children}
    </ui-disclosure>
  );
}
