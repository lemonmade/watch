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

import {useCustomElementProperties} from './shared.ts';

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
    const allProps: DisclosureProps = {...props};

    let labelElement: ReactNode;

    if (label) {
      if (isValidElement(label)) {
        labelElement = cloneElement<any>(label, {slot: 'label'});
      } else {
        allProps.label = label;
      }
    }

    const wrapperRef = useCustomElementProperties(allProps, ref);

    return (
      <ui-disclosure {...props} ref={wrapperRef}>
        {children}
        {labelElement}
      </ui-disclosure>
    );
  },
);
