export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  // Let tappable summit share links (/s/<slug>) route to their handler.
  if (path.startsWith('/s/')) return path;
  return '/';
}
