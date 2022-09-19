import {useMemo} from 'react';
import type {PropsWithChildren, ReactNode, FormEventHandler} from 'react';

import {Portal} from '../Portal';
import {View, useViewProps, resolveViewProps, type ViewProps} from '../View';

import {useUniqueId} from '../../utilities/id';
import {
  ImplicitActionContext,
  type ImplicitAction,
} from '../../utilities/actions';
import {
  FormContext,
  useContainingForm,
  type FormDetails,
} from '../../utilities/forms';

export interface ImplicitSubmit {
  label: string;
}

interface Props extends ViewProps {
  id?: string;
  loading?: boolean;
  implicitSubmit?: boolean | ImplicitSubmit;
  onSubmit(): void;
}

export function Form({
  id: explicitId,
  loading,
  onSubmit,
  children,
  implicitSubmit = false,
  ...viewProps
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Form', explicitId);
  const nested = useContainingForm() != null;
  const [formDetails, implicitAction] = useMemo<[FormDetails, ImplicitAction]>(
    () => [
      {id, nested},
      {type: 'submit', target: {id, type: 'form'}},
    ],
    [id, nested],
  );

  const view = useViewProps(viewProps);

  let implicitSubmitContent: ReactNode = null;

  if (implicitSubmit === true) {
    implicitSubmitContent = (
      <View visibility="hidden" accessibilityVisibility="visible">
        <ImplicitSubmitter form={formDetails}>Submit</ImplicitSubmitter>
      </View>
    );
  } else if (typeof implicitSubmit === 'object') {
    implicitSubmitContent = (
      <View visibility="hidden" accessibilityVisibility="visible">
        <ImplicitSubmitter form={formDetails}>
          {implicitSubmit.label}
        </ImplicitSubmitter>
      </View>
    );
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSubmit();
  };

  const content = implicitSubmitContent ? (
    <>
      {children}
      {implicitSubmitContent}
    </>
  ) : (
    <ImplicitActionContext action={implicitAction}>
      {children}
    </ImplicitActionContext>
  );

  return nested ? (
    <>
      <div
        {...resolveViewProps(view)}
        // @ts-expect-error This is a valid prop!
        inert={loading}
      >
        <FormContext.Provider value={formDetails}>
          {content}
        </FormContext.Provider>
      </div>
      <Portal>
        <form id={id} onSubmit={handleSubmit} />
      </Portal>
    </>
  ) : (
    <form
      {...resolveViewProps(view)}
      id={id}
      onSubmit={handleSubmit}
      // @ts-expect-error This is a valid prop!
      inert={loading}
    >
      {content}
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
