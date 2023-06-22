import {useApi} from './api.ts';

export function useLocalize() {
  return useApi().localize;
}

export function useLocale() {
  return useLocalize().locale;
}

export function useTranslate() {
  return useLocalize().translate;
}
