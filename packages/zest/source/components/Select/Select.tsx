import {
  isSignal,
  resolveSignalOrValue,
  type SignalOrValue,
} from '@watching/react-signals';
import {useUniqueId} from '../../utilities/id';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value?: SignalOrValue<string>;
  label: string;
  options: Option[];
  onChange?(value: string): void;
}

export function Select({value, label, options, onChange}: Props) {
  const id = useUniqueId('Select');
  const resolvedValue = resolveSignalOrValue(value);

  const handleChange =
    onChange ??
    (isSignal(value)
      ? (newValue) => {
          value.value = newValue;
        }
      : undefined);

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={resolvedValue}
        onChange={({currentTarget}) => handleChange?.(currentTarget.value)}
      >
        {options.map(({value, label}) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
