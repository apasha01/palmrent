export function stripLocale(pathname: string, locale: string) {
  const prefix = `/${locale}`;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(prefix + "/")) return pathname.slice(prefix.length);
  return pathname || "/";
}
