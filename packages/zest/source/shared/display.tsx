import type {RenderableProps} from 'preact';
import {createOptionalContext} from '@quilted/quilt/context';

export type Display = 'block' | 'inline';

const ImplicitDisplayContext = createOptionalContext<Display>(undefined);

export const useImplicitDisplay = () =>
  ImplicitDisplayContext.use({optional: true});

export function ImplicitDisplay({
  display,
  children,
}: RenderableProps<{display?: Display}>) {
  return (
    <ImplicitDisplayContext.Provider value={display}>
      {children}
    </ImplicitDisplayContext.Provider>
  );
}
