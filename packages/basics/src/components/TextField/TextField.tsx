import {useState, useRef} from 'react';
import type {ChangeEvent, KeyboardEvent} from 'react';
import {variation} from '@lemon/css';

import {useDomProps, toProps} from '../../system';
import type {SystemProps} from '../../system';

import {useUniqueId} from '../../utilities/id';
import {useContainingForm} from '../../utilities/forms';

import styles from './TextField.module.css';

interface Props extends SystemProps {
  id?: string;
  value?: string;
  multiline?: boolean | number;
  blockSize?: 'fitContent';
  onInput?(value: string): void;
  onChange?(value: string): void;
}

export function TextField({
  id: explicitId,
  value: currentValue,
  multiline = false,
  blockSize = multiline === true ? 'fitContent' : undefined,
  onInput,
  onChange,
  ...systemProps
}: Props) {
  const id = useUniqueId('TextField', explicitId);
  const [value, setValue] = usePartiallyControlledState(currentValue);
  const containingForm = useContainingForm();

  // eslint-disable-next-line no-warning-comments
  // TODO: split out the font + padding properties into a separate object,
  // spread over the autogrow wrap and input element
  const dom = useDomProps({
    ...systemProps,
    display: multiline ? 'grid' : undefined,
  });

  dom.addClassName(styles.TextField);

  if (multiline) dom.addClassName(styles.multiline);
  if (blockSize) dom.addClassName(styles[variation('blockSize', blockSize)]);

  if (typeof multiline === 'number') {
    dom.addStyles({'--x-TextField-lines': multiline});
  }

  const InputElement = multiline ? 'textarea' : 'input';

  return (
    <div {...toProps(dom)}>
      <InputElement
        id={id}
        type={multiline ? undefined : 'text'}
        className={styles.Input}
        value={value}
        onChange={({
          currentTarget,
        }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setValue(currentTarget.value);
          onInput?.(currentTarget.value);
        }}
        onKeyPress={({
          key,
          currentTarget,
        }: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          if (!multiline && key.toLowerCase() === 'enter') {
            setValue(currentTarget.value);
            onInput?.(currentTarget.value);
            onChange?.(currentTarget.value);
          }
        }}
        onBlur={() => onChange?.(value ?? '')}
        form={containingForm?.nested ? containingForm.id : undefined}
      />
      {blockSize === 'fitContent' && (
        <div className={styles.AutoGrowWrap}>{value} </div>
      )}
    </div>
  );
}

function usePartiallyControlledState(value = '') {
  const [localValue, setLocalValue] = useState(value);
  const lastExplicitValue = useRef(value);

  let valueToReturn = localValue;

  if (lastExplicitValue.current !== value) {
    lastExplicitValue.current = value;
    setLocalValue(value);
    valueToReturn = value;
  }

  return [valueToReturn, setLocalValue] as const;
}
