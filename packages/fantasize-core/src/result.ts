export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = unknown> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;
export const map = <T, U, E>(r: Result<T, E>, f: (v: T) => U): Result<U, E> =>
  isOk(r) ? ok(f(r.value)) : r;
export const mapError = <T, E, F>(
  r: Result<T, E>,
  f: (e: E) => F
): Result<T, F> => (isErr(r) ? err(f(r.error)) : r);
export const flatMap = <T, U, E>(
  r: Result<T, E>,
  f: (v: T) => Result<U, E>
): Result<U, E> => (isOk(r) ? f(r.value) : r);
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (isOk(r)) return r.value;
  throw r.error instanceof Error ? r.error : new Error(String(r.error));
};
export const unwrapOr = <T, E>(r: Result<T, E>, fallback: T): T =>
  isOk(r) ? r.value : fallback;
export const unwrapOrElse = <T, E>(r: Result<T, E>, get: () => T): T =>
  isOk(r) ? r.value : get();
