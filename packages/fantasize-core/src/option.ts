export type None = { kind: 'none' };
export type Some<T> = { kind: 'some'; value: T };
export type Option<T> = None | Some<T>;

export const none: None = { kind: 'none' };
export const some = <T>(value: T): Option<T> => ({ kind: 'some', value });
export const isSome = <T>(o: Option<T>): o is Some<T> => o.kind === 'some';
export const isNone = <T>(o: Option<T>): o is None => o.kind === 'none';
export const mapOption = <T, U>(o: Option<T>, f: (v: T) => U): Option<U> =>
  isSome(o) ? some(f(o.value)) : none;
export const flatMapOption = <T, U>(
  o: Option<T>,
  f: (v: T) => Option<U>
): Option<U> => (isSome(o) ? f(o.value) : none);
export const unwrapOr = <T>(o: Option<T>, fallback: T): T =>
  isSome(o) ? o.value : fallback;
export const unwrapOrElse = <T>(o: Option<T>, get: () => T): T =>
  isSome(o) ? o.value : get();
