// The brotli-size package doesn’t have a proper ESM version, and at runtime
// ends up having an object with all its exports as the `default` export of
// the package.
export async function brotliSize(code: string) {
  const {default: imported} = await import('brotli-size');

  const brotliSize: typeof import('brotli-size').default =
    'default' in imported
      ? (imported as unknown as {default: any}).default
      : (imported as any);

  return brotliSize(code);
}
