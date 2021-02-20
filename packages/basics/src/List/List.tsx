import type {ReactNode} from 'react';

export function List({children}: {children?: ReactNode}) {
  return <ul>{children}</ul>;
}

export function Item({children}: {children?: ReactNode}) {
  return <li>{children}</li>;
}
