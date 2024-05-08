import type {Signal} from '@preact/signals-core';
import {createOptionalContext} from '@quilted/preact-context';

export interface FormDetails {
  readonly id: string;
  readonly nested: boolean;
  readonly disabled: Signal<boolean>;
  readonly submitting: Signal<boolean>;
}

export const FormContext = createOptionalContext<FormDetails>();

export const useContainingForm = () => FormContext.use({optional: true});
