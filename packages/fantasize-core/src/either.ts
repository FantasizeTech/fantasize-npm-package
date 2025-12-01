export type Left<L> = { left: L; right?: never };
export type Right<R> = { right: R; left?: never };
export type Either<L, R> = Left<L> | Right<R>;

export const left = <L, R = never>(l: L): Either<L, R> => ({ left: l });
export const right = <R, L = never>(r: R): Either<L, R> => ({ right: r });
export const isLeft = <L, R>(e: Either<L, R>): e is Left<L> => 'left' in e;
export const isRight = <L, R>(e: Either<L, R>): e is Right<R> => 'right' in e;
export const mapLeft = <L, R, NL>(
  e: Either<L, R>,
  f: (l: L) => NL
): Either<NL, R> => (isLeft(e) ? left(f(e.left)) : e);
export const mapRight = <L, R, NR>(
  e: Either<L, R>,
  f: (r: R) => NR
): Either<L, NR> => (isRight(e) ? right(f(e.right)) : e);
export const fold = <L, R, T>(
  e: Either<L, R>,
  onLeft: (l: L) => T,
  onRight: (r: R) => T
): T => (isLeft(e) ? onLeft(e.left) : onRight((e as Right<R>).right));
