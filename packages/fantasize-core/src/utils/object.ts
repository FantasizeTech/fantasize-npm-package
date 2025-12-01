export function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (k in obj) (out as any)[k] = obj[k];
  return out;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const out = {} as Omit<T, K>;
  const set = new Set<K>(keys);
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!set.has(key as K)) (out as any)[key] = obj[key];
  }
  return out;
}
