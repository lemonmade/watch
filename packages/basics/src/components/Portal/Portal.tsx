import type {PropsWithChildren} from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import {createPortal} from 'react-dom';

interface Props {
  to?: HTMLElement;
}

export function Portal({to, children}: PropsWithChildren<Props>) {
  return to ? createPortal(children, to) : null;
}
