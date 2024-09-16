import {
  forwardRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  type PropsWithChildren,
  type ForwardedRef,
} from 'react';

import type {
  Disclosure as DisclosureElement,
  DisclosureProperties,
} from '@watching/clips/elements';

export interface DisclosureProps
  extends PropsWithChildren<Omit<Partial<DisclosureProperties>, 'label'>> {
  ref?: ForwardedRef<DisclosureElement>;
  label?: ReactNode;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-disclosure': DisclosureProps;
    }
  }
}
export const Disclosure = forwardRef<DisclosureElement, DisclosureProps>(
  function Disclosure({label, children, ...props}, ref) {
    return label && isValidElement(label) ? (
      <ui-disclosure {...props} ref={ref}>
        {children}
        {cloneElement<any>(label, {slot: 'label'})}
      </ui-disclosure>
    ) : (
      <ui-disclosure label={label} {...props} ref={ref}>
        {children}
      </ui-disclosure>
    );
  },
);
