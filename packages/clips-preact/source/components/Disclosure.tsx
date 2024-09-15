import {
  cloneElement,
  isValidElement,
  type ComponentChild,
  type RenderableProps,
} from 'preact';

import type {
  Disclosure as DisclosureElement,
  DisclosureProperties,
} from '@watching/clips/elements';

export interface DisclosureProps
  extends Omit<Partial<DisclosureProperties>, 'label'> {
  label?: ComponentChild;
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-disclosure': RenderableProps<DisclosureProps, DisclosureElement>;
    }
  }
}

export function Disclosure({
  label,
  children,
  ...props
}: RenderableProps<DisclosureProps, DisclosureElement>) {
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
