import {
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type HTMLAttributes,
} from 'react';
import {classes, variation} from '@lemon/css';
import {
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';

import {useUniqueId} from '../../utilities/id';
import {useContainingForm} from '../../utilities/forms';
import {useMenuController} from '../../utilities/menus';
import {useActionScope} from '../../utilities/actions';
import {type PropsForClipsComponent} from '../../utilities/clips';

import styles from './Input.module.css';

export type InputProps = Omit<
  PropsForClipsComponent<'TextField'>,
  'label' | 'labelStyle'
>;

export function Input({
  id: explicitId,
  value: currentValue,
  type,
  disabled,
  readonly,
  multiline = false,
  blockSize = multiline === true ? 'fit' : undefined,
  placeholder,
  changeTiming = 'commit',
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

  let inputMode: HTMLAttributes<HTMLElement>['inputMode'];
  let autoCorrect: HTMLAttributes<HTMLElement>['autoCorrect'];
  let autoCapitalize: HTMLAttributes<HTMLElement>['autoCapitalize'];
  const inlineStyles: Record<string, any> = {};

  if (type === 'email') {
    inputMode = 'email';
    autoCorrect = 'off';
    autoCapitalize = 'none';
  }

  if (typeof multiline === 'number') {
    inlineStyles['--x-Input-lines'] = multiline;
  }

  const InputElement = multiline ? 'textarea' : 'input';

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
        multiline && styles.multiline,
        blockSize && styles[variation('blockSize', blockSize)],
      )}
      style={inlineStyles}
    >
      <InputElement
        id={id}
        type={multiline ? undefined : 'text'}
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
          multiline || changeTiming !== 'commit'
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
      {blockSize === 'fit' && (
        <div className={styles.AutoGrowWrap}>{value} </div>
      )}
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
