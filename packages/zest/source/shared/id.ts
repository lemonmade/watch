import {createContext} from 'preact';
import {useContext, useMemo} from 'preact/hooks';

export class UniqueIdFactory {
  private readonly counters = new Map<string, number>();

  next(prefix: string) {
    const currentCount = this.counters.get(prefix) ?? -1;
    const newCount = currentCount + 1;
    this.counters.set(prefix, newCount);
    return `${prefix}${newCount}`;
  }
}

export const UniqueIdContext = createContext(new UniqueIdFactory());

export function useUniqueIdFactory() {
  return useContext(UniqueIdContext);
}

export function useUniqueId(prefix: string, explicitId?: string) {
  const factory = useUniqueIdFactory();
  const autoId = useMemo(() => factory.next(prefix), [factory, prefix]);
  return explicitId ?? autoId;
}
