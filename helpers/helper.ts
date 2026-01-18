export function toFaDigits(input: unknown) {
  if (input === null || input === undefined) return "";
  const s = String(input);
  const en = "0123456789";
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  return s.replace(/\d/g, (d) => fa[en.indexOf(d)]);
}


export function capitalizeWords(text) {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}