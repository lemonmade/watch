export type ClassValue = string | number | boolean | undefined | null;
export interface ClassMapping {
  [key: string]: any;
}
export type ClassArgument = ClassValue | ClassMapping | ClassArgument[];

export function classes(...args: ClassArgument[]) {
  const classnames: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string') {
      classnames.push(arg);
    } else if (typeof arg === 'number') {
      classnames.push(String(arg));
    } else if (Array.isArray(arg)) {
      const innerClasses = classes(...arg);
      if (innerClasses) classnames.push(innerClasses);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classnames.push(key);
      }
    } else {
      classnames.push(String(arg));
    }
  }

  return classnames.join(' ');
}

export function variation(name: string, value: string) {
  return `${name}${value[0].toUpperCase()}${value.substr(1)}`;
}
