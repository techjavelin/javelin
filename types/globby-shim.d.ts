// Shim to silence phantom TS error about globby default export in scripts.
// We are not using globby directly anymore (replaced by fast-glob) but a lingering type diagnostic
// persists; provide minimal module declaration so TS doesn't attempt to resolve real types.
declare module 'globby' {
  export function globby(patterns: string | readonly string[], options?: any): Promise<string[]>;
  export function globbySync(patterns: string | readonly string[], options?: any): string[];
  const _default: { globby: typeof globby };
  export default _default;
}
