export function removeFromSet<T>(set: Set<T>, value: T) {
  const newSet = new Set(set);
  newSet.delete(value);
  return newSet;
}
