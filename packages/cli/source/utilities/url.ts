export function watchUrl(path: string) {
  return new URL(
    path,
    process.env.WATCH_ROOT_URL ?? 'https://watch.lemon.tools',
  );
}
