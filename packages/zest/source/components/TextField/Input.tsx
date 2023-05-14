import {
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type HTMLAttributes,
} from 'react';
import {classes} from '@lemon/css';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';

import {useUniqueId} from '../../shared/id.ts';
import {useContainingForm} from '../../shared/forms.ts';
import {useMenuController} from '../../shared/menus.ts';
import {useActionScope} from '../../shared/actions.tsx';
import {type ReactComponentPropsForClipsElement} from '../../shared/clips.ts';

import styles from './Input.module.css';

export type InputProps = Omit<
  ReactComponentPropsForClipsElement<'ui-text-field'>,
  'label' | 'labelStyle'
>;

export function Input({
  id: explicitId,
  value: currentValue,
  keyboardType,
  disabled,
  readonly,
  minimumLines = 1,
  maximumLines = minimumLines,
  placeholder,
  changeTiming = 'commit',
  resize,
  autocomplete,
  onInput,
  onChange,
}: InputProps) {
  const id = useUniqueId('Input', explicitId);
  const [value, setValue] = usePartiallyControlledState(currentValue);
  const containingForm = useContainingForm();
  const menu = useMenuController({required: false});
  const actionScope = useActionScope({required: false});

  const resolvedDisabled = resolveSignalOrValue(disabled);
  const resolvedReadonly = resolveSignalOrValue(readonly);

  const finalReadonly = resolvedReadonly || actionScope?.active.value;

  const normalizedMaximumLines =
    typeof maximumLines === 'number' ? maximumLines : Infinity;
  const isMultiline = minimumLines > 1 || normalizedMaximumLines > 1;
  const needsAutogrow = minimumLines !== normalizedMaximumLines;

  let inputMode: HTMLAttributes<HTMLElement>['inputMode'];
  let autoCorrect: HTMLAttributes<HTMLElement>['autoCorrect'];
  let autoCapitalize: HTMLAttributes<HTMLElement>['autoCapitalize'];
  const inlineStyles: Record<string, any> = {};

  if (keyboardType === 'email') {
    inputMode = 'email';
    autoCorrect = 'off';
    autoCapitalize = 'none';
  }

  if (isMultiline) {
    inlineStyles['--z-internal-TextField-minimum-lines'] = minimumLines;

    if (Number.isFinite(normalizedMaximumLines)) {
      inlineStyles['--z-internal-TextField-maximum-lines'] =
        normalizedMaximumLines;
    }
  }

  const InputElement = isMultiline ? 'textarea' : 'input';

  const handleChange =
    onChange ??
    (resolvedDisabled ||
    finalReadonly ||
    currentValue == null ||
    typeof currentValue === 'string'
      ? undefined
      : (newValue: string) => {
          currentValue.value = newValue;
        });

  return (
    <div
      className={classes(
        styles.TextField,
        isMultiline && styles.multiline,
        resize && styles.resize,
        !Number.isFinite(normalizedMaximumLines) && styles.growUnbounded,
      )}
      style={inlineStyles}
    >
      <InputElement
        id={id}
        type={isMultiline ? undefined : 'text'}
        className={styles.Input}
        value={value}
        inputMode={inputMode}
        onChange={({
          currentTarget,
        }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const newValue = currentTarget.value;
          setValue(newValue);
          onInput?.(newValue);
          if (changeTiming === 'input') handleChange?.(newValue);
        }}
        onKeyDown={menu?.keypress}
        onKeyPress={
          isMultiline || changeTiming !== 'commit'
            ? undefined
            : (
                event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
              ) => {
                const {key, currentTarget} = event;
                const newValue = currentTarget.value;

                if (key.toLowerCase() === 'enter') {
                  onInput?.(newValue);
                  handleChange?.(newValue);
                }
              }
        }
        onBlur={
          changeTiming === 'commit'
            ? () => handleChange?.(value ?? '')
            : undefined
        }
        form={containingForm?.nested ? containingForm.id : undefined}
        placeholder={placeholder}
        disabled={resolvedDisabled}
        readOnly={finalReadonly}
        autoComplete={autocomplete}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
      />
      {needsAutogrow && <div className={styles.AutoGrowWrap}>{value} </div>}
    </div>
  );
}

function usePartiallyControlledState(
  value: SignalOrValue<string | undefined> = '',
) {
  const resolvedValue = resolveSignalOrValue(value) ?? '';
  const [localValue, setLocalValue] = useState(resolvedValue);
  const lastExplicitValue = useRef(resolvedValue);

  let valueToReturn = localValue;

  if (lastExplicitValue.current !== resolvedValue) {
    lastExplicitValue.current = resolvedValue;
    setLocalValue(resolvedValue);
    valueToReturn = resolvedValue;
  }

  return [valueToReturn, setLocalValue] as const;
}
