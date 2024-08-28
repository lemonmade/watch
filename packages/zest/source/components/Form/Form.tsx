import {useMemo} from 'preact/hooks';
import type {RenderableProps, ComponentChild, JSX} from 'preact';
import {computed, signal, type SignalOrValue} from '@quilted/quilt/signals';

import {Portal} from '../Portal.tsx';
import {
  View,
  useViewProps,
  resolveViewProps,
  type ViewProps,
} from '../View.tsx';

import {removeFromSet} from '../../shared/sets.ts';
import {useUniqueId} from '../../shared/id.ts';
import {
  createActionScope,
  ActionScopeContext,
  type ActionScope,
} from '../../shared/actions.tsx';
import {
  FormContext,
  useContainingForm,
  type FormDetails,
} from '../../shared/forms.ts';

export interface ImplicitSubmit {
  label: string;
}

export interface FormProps extends ViewProps {
  id?: string;
  implicitSubmit?: boolean | ImplicitSubmit;
  disabled?: SignalOrValue<boolean>;
  onSubmit(): void | Promise<void>;
}

export function Form({
  ref,
  id: explicitId,
  disabled = false,
  onSubmit,
  children,
  implicitSubmit = false,
  ...viewProps
}: RenderableProps<FormProps, HTMLFormElement>) {
  const id = useUniqueId('Form', explicitId);
  const nested = useContainingForm() != null;

  const {formDetails, actionScope, performSubmit} = useMemo<{
    formDetails: Omit<FormDetails, 'disabled'>;
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

  const finalFormDetails = useMemo<FormDetails>(() => {
    return {
      ...formDetails,
      disabled: typeof disabled === 'boolean' ? signal(disabled) : disabled,
    };
  }, [disabled, formDetails]);

  const view = useViewProps(viewProps);

  let implicitSubmitContent: ComponentChild = null;

  if (implicitSubmit === true) {
    implicitSubmitContent = (
      <View visibility="hidden" accessibilityVisibility="visible">
        <ImplicitSubmitter form={finalFormDetails}>Submit</ImplicitSubmitter>
      </View>
    );
  } else if (typeof implicitSubmit === 'object') {
    implicitSubmitContent = (
      <View visibility="hidden" accessibilityVisibility="visible">
        <ImplicitSubmitter form={finalFormDetails}>
          {implicitSubmit.label}
        </ImplicitSubmitter>
      </View>
    );
  }

  const handleSubmit: JSX.SubmitEventHandler<HTMLFormElement> = async (
    event,
  ) => {
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
          <FormContext.Provider value={finalFormDetails}>
            {content}
          </FormContext.Provider>
        </ActionScopeContext>
      </div>
      <Portal>
        <form ref={ref} id={id} onSubmit={handleSubmit} />
      </Portal>
    </>
  ) : (
    <form {...resolveViewProps(view)} ref={ref} id={id} onSubmit={handleSubmit}>
      <ActionScopeContext scope={actionScope}>
        <FormContext.Provider value={finalFormDetails}>
          {content}
        </FormContext.Provider>
      </ActionScopeContext>
    </form>
  );
}

function ImplicitSubmitter({
  form,
  children,
}: RenderableProps<{form: FormDetails}>) {
  return (
    <button
      type="submit"
      disabled={form.disabled.value}
      form={form.nested ? form.id : undefined}
    >
      {children}
    </button>
  );
}
