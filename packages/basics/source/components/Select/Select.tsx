import {useUniqueId} from '../../utilities/id';

interface Option {
  value: string;
  label: string;
}

interface Props {
  value?: string;
  label: string;
  options: Option[];
  onChange?(value: string): void;
}

export function Select({value, label, options, onChange}: Props) {
  const id = useUniqueId('Select');

  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={({currentTarget}) => onChange?.(currentTarget.value)}
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
