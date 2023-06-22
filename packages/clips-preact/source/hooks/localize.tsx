import {Fragment, isValidElement, cloneElement} from 'preact';
import {useMemo} from 'preact/hooks';

import {useApi} from './api.ts';

export interface Translate {
  <Placeholder extends string | number | JSX.Element = string>(
    key: string,
    placeholders?: {[key: string]: Placeholder | string | number},
  ): Placeholder extends string | number ? string : JSX.Element;
}

export function useLocalize() {
  return useApi().localize;
}

export function useLocale() {
  return useLocalize().locale;
}

export function useTranslate() {
  const baseTranslate = useLocalize().translate;

  return useMemo<Translate>(() => {
    return function translate(key, placeholders) {
      const translation = baseTranslate(key, placeholders);

      if (typeof translation === 'string') {
        return translation;
      }

      return (
        <Fragment
          // eslint-disable-next-line react/no-children-prop
          children={translation.map((child, index) =>
            isValidElement(child) ? cloneElement(child, {key: index}) : child,
          )}
        />
      ) as any;
    };
  }, [baseTranslate]);
}
