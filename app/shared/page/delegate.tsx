import {createContext, useContext} from 'react';
import type {ReactNode, PropsWithChildren} from 'react';

export interface PageDelegate {
  claim(options: {
    readonly heading: string | ReactNode;
    readonly actions?: ReactNode;
  }): () => void;
}

const PageDelegateContextInternal = createContext<PageDelegate | null>(null);

export function PageDelegateContext({
  delegate,
  children,
}: PropsWithChildren<{delegate: PageDelegate}>) {
  return (
    <PageDelegateContextInternal.Provider value={delegate}>
      {children}
    </PageDelegateContextInternal.Provider>
  );
}

export function usePageDelegate() {
  const delegate = useContext(PageDelegateContextInternal);

  if (delegate == null) {
    throw new Error('Missing page delegate context');
  }

  return delegate;
}
