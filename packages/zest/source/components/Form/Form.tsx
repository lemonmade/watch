import {useMemo} from 'react';
import {computed, signal} from '@watching/react-signals';
import type {PropsWithChildren, ReactNode, FormEventHandler} from 'react';

import {Portal} from '../Portal';
import {View, useViewProps, resolveViewProps, type ViewProps} from '../View';

import {removeFromSet} from '../../utilities/sets';
import {useUniqueId} from '../../utilities/id';
import {
  createActionScope,
  ActionScopeContext,
  type ActionScope,
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
  implicitSubmit?: boolean | ImplicitSubmit;
  onSubmit(): void | Promise<void>;
}

export function Form({
  id: explicitId,
  onSubmit,
  children,
  implicitSubmit = false,
  ...viewProps
}: PropsWithChildren<Props>) {
  const id = useUniqueId('Form', explicitId);
  const nested = useContainingForm() != null;
  const {formDetails, actionScope, performSubmit} = useMemo<{
    formDetails: FormDetails;
    actionScope: ActionScope;
    performSubmit<T>(
      submit: () => T,
      options?: {id?: string; signal?: AbortSignal},
    ): void;
  }>(() => {
    const actionScope = createActionScope({id});
    const submits = signal<Set<{id: string}>>(new Set());
    let submitCount = 0;

    return {
      actionScope,
      formDetails: {
        id,
        nested,
        submitting: computed(() => submits.value.size > 0),
      },
      performSubmit(
        submit,
        {id: submitId = `${id}:Submit${submitCount++}`, signal} = {},
      ) {
        return actionScope.perform(
          () => {
            const submitResult = submit();

            if (typeof (submitResult as any)?.then !== 'function') {
              return submitResult;
            }

            const submitObject = {id: submitId};
            const finish = () => {
              submits.value = removeFromSet(submits.value, submitObject);
            };

            submits.value = new Set([...submits.value, submitObject]);
            signal?.addEventListener('abort', finish, {once: true});

            return (async () => {
              try {
                const result = await submitResult;
                return result;
              } finally {
                finish();
              }
            })() as any;
          },
          {id: submitId, signal},
        );
      },
    };
  }, [id, nested]);

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

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    performSubmit(onSubmit);
  };

  const content = implicitSubmitContent ? (
    <>
      {children}
      {implicitSubmitContent}
    </>
  ) : (
    children
  );

  return nested ? (
    <>
      <div {...resolveViewProps(view)}>
        <ActionScopeContext scope={actionScope}>
          <FormContext.Provider value={formDetails}>
            {content}
          </FormContext.Provider>
        </ActionScopeContext>
      </div>
      <Portal>
        <form id={id} onSubmit={handleSubmit} />
      </Portal>
    </>
  ) : (
    <form {...resolveViewProps(view)} id={id} onSubmit={handleSubmit}>
      <ActionScopeContext scope={actionScope}>
        <FormContext.Provider value={formDetails}>
          {content}
        </FormContext.Provider>
      </ActionScopeContext>
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
