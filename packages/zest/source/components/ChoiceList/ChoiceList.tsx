import {createContext, useContext, useMemo} from 'react';
import type {PropsWithChildren} from 'react';
import {useUniqueId} from '../../utilities/id';

interface ChoiceListContextValue {
  id: string;
  value?: string;
  onChange(value: string): void;
}

const ChoiceListContext = createContext<ChoiceListContextValue | null>(null);

export interface Props<Value extends string = string> {
  id?: string;
  value?: Value;
  onChange(value: Value): void;
}

export function ChoiceList<Value extends string = string>({
  id: explicitId,
  children,
  value,
  onChange,
}: PropsWithChildren<Props<Value>>) {
  const id = useUniqueId('ChoiceList', explicitId);

  const contextValue = useMemo<ChoiceListContextValue>(
    () => ({
      id,
      value,
      onChange,
    }),
    [id, value, onChange],
  );

  return (
    <ChoiceListContext.Provider value={contextValue}>
      <div>{children}</div>
    </ChoiceListContext.Provider>
  );
}

export interface ChoiceProps {
  id?: string;
  value: string;
}

export function Choice({
  id: explicitId,
  value,
  children,
}: PropsWithChildren<ChoiceProps>) {
  const id = useUniqueId('ChoiceListOption', explicitId);
  const selectorContext = useContext(ChoiceListContext);

  if (selectorContext == null) {
    throw new Error(
      `You need to render <Option> in an <ChoiceList> component.`,
    );
  }

  return (
    <div>
      <input
        id={id}
        name={selectorContext.id}
        type="radio"
        value={value}
        checked={value === selectorContext.value}
        onChange={({currentTarget: {value}}) => {
          selectorContext.onChange(value);
        }}
      ></input>
      <label htmlFor={id}>{children}</label>
    </div>
  );
}
