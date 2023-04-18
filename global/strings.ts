export function toHandle(string: string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .trim()
    .replace(/-+$/, '')
    .replace(/^-+/, '');
}
