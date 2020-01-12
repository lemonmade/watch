import React, {ReactNode} from 'react';
import {Controller, ControllerContext} from '@remote-ui/react/host';

import './Ui.css';

import {View} from './components';

interface Props {
  children?: ReactNode;
}

const controller = new Controller({
  View,
});

export function Ui({children}: Props) {
  return (
    <ControllerContext.Provider value={controller}>
      {children}
    </ControllerContext.Provider>
  );
}
