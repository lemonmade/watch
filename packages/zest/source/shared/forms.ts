import {type Signal} from '@preact/signals-core';
import {createContext, useContext} from 'react';

export interface FormDetails {
  readonly id: string;
  readonly nested: boolean;
  readonly disabled: Signal<boolean>;
  readonly submitting: Signal<boolean>;
}

export const FormContext = createContext<FormDetails | undefined>(undefined);

export const useContainingForm = () => useContext(FormContext);
