/** Same-origin path only — prevents open redirects */
export function sanitizeNext(next: string | null): string {
  if (!next) return '/dashboard';
  const path = next.trim().split('?')[0];
  if (!path.startsWith('/') || path.startsWith('//')) return '/dashboard';
  if (path.includes('..')) return '/dashboard';
  if (!/^\/[a-zA-Z0-9/_-]+$/.test(path)) return '/dashboard';
  return path;
}
