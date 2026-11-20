export function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function intParam(value: string | string[] | undefined, fallback = 1) {
  const n = Number(one(value));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function str(value: string | string[] | undefined) {
  return one(value)?.trim() || undefined;
}
