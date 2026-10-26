/** Prefixes a public/ file path with the deploy base path (e.g. /chest-run-tracker on GitHub Pages). */
export function asset(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}
