import {useMemo} from 'react';
import type {PropsWithChildren, ReactNode, FormEventHandler} from 'react';

import {Portal} from '../Portal';
import {VisuallyHidden} from '../VisuallyHidden';

import {useUniqueId} from '../../utilities/id';
import {FormContext, useContainingForm} from '../../utilities/forms';
import type {FormDetails} from '../../utilities/forms';

export interface ImplicitSubmit {
  label: string;
}

interface Props {
  id?: string;
  implicitSubmit?: boolean | ImplicitSubmit;
  onSubmit(): void;
}

export function Form({
  id: explicitId,
  onSubmit,
  children,
  implicitSubmit = true,
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Form', explicitId);
  const nested = useContainingForm() != null;
  const formDetails = useMemo<FormDetails>(() => ({id, nested}), [id, nested]);

  let implicitSubmitContent: ReactNode = null;

  if (implicitSubmit === true) {
    implicitSubmitContent = (
      <VisuallyHidden>
        <ImplicitSubmitter form={formDetails}>Submit</ImplicitSubmitter>
      </VisuallyHidden>
    );
  } else if (typeof implicitSubmit === 'object') {
    implicitSubmitContent = (
      <VisuallyHidden>
        <ImplicitSubmitter form={formDetails}>
          {implicitSubmit.label}
        </ImplicitSubmitter>
      </VisuallyHidden>
    );
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSubmit();
  };

  return nested ? (
    <>
      <div>
        <FormContext.Provider value={formDetails}>
          {children}
          {implicitSubmitContent}
        </FormContext.Provider>
      </div>
      <Portal>
        <form id={id} onSubmit={handleSubmit} />
      </Portal>
    </>
  ) : (
    <form id={id} onSubmit={handleSubmit}>
      <FormContext.Provider value={formDetails}>
        {children}
        {implicitSubmitContent}
      </FormContext.Provider>
    </form>
  );
}

function ImplicitSubmitter({
  form,
  children,
}: PropsWithChildren<{form: FormDetails}>) {
  return (
    <button type="submit" form={form.nested ? form.id : undefined}>
      {children}
    </button>
  );
}
