import {useApi} from './api.ts';
import {useSignalValue} from '../signals.ts';

export function useQuery<Data = Record<string, unknown>>() {
  return useSignalValue(useApi().query) as Data;
}
