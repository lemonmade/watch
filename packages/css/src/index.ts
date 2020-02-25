export {default as classes} from 'classnames';

export function variation(name: string, value: string) {
  return `${name}${value[0].toUpperCase()}${value.substr(1)}`;
}
