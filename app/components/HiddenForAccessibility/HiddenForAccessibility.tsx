import React, {PropsWithChildren} from 'react';

export function HiddenForAccessibility({children}: PropsWithChildren<{}>) {
  return <span aria-hidden="true">{children}</span>;
}
