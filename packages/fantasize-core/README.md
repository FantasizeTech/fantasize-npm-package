# @fantasizetech/fantasize-core

ศูนย์กลางของ type + utils สำหรับ Fantasize ecosystem (Result, Option, Either, Paginated, Error classes, และ object/date/crypto/async helpers) ใช้ร่วมกันได้ทุกแพ็กเกจ. Node 20+.

Central functional types & zero-dependency utilities for the Fantasize ecosystem.

## Install

```bash
npm i @fantasizetech/fantasize-core
```

## Contents

- Functional Types: `Result`, `Option`, `Either`, `Paginated<T>`
- Errors: `DomainError`, `ApiError`
- Object: `deepClone`, `pick`, `omit`
- Async: `sleep`, `debounce`, `throttle`
- Crypto: `uuid`, `nanoid`
- Date: `parseISO`, `formatISO`, `addDays`, `startOfDay`, `endOfDay`, `diffInDays`, `relativeTime`, etc.

## Quick Examples

### Result

```ts
import { Result, ok, err, map, unwrapOr } from '@fantasizetech/fantasize-core';

function mayFail(flag: boolean): Result<number, string> {
  return flag ? ok(42) : err('NO_ANSWER');
}

const r = mayFail(true);
const plusOne = map(r, (n) => n + 1); // Ok(43)
console.log(unwrapOr(plusOne, 0));
```

### Option

```ts
import { Option, some, none, mapOption, unwrapOr } from '@fantasizetech/fantasize-core';
const maybeUser: Option<{ name: string }> = Math.random() > 0.5 ? some({ name: 'Kai' }) : none;
const nameLen = mapOption(maybeUser, (u) => u.name.length);
console.log('len:', unwrapOr(nameLen, 0));
```

### Either

```ts
import { Either, left, right, fold } from '@fantasizetech/fantasize-core';
function parseIntEither(v: string): Either<string, number> {
  const n = Number(v);
  return Number.isNaN(n) ? left('NOT_NUMBER') : right(n);
}
const value = fold(
  parseIntEither('10'),
  (err) => 0,
  (n) => n * 2
); // 20
```

### Paginated

```ts
import { paginate } from '@fantasizetech/fantasize-core';
const page = paginate(
  Array.from({ length: 55 }, (_, i) => i + 1),
  2,
  10
);
// items 11..20
```

### Errors

```ts
import { DomainError, ApiError } from '@fantasizetech/fantasize-core';
throw new DomainError('SKU_DUPLICATE', 'SKU already used');
throw new ApiError(404, 'Not found', 'NOT_FOUND');
```

### Object Utilities

```ts
import { deepClone, pick, omit } from '@fantasizetech/fantasize-core';
const obj = { a: 1, b: 2, c: 3 };
pick(obj, ['a', 'c']); // { a:1, c:3 }
omit(obj, ['b']); // { a:1, c:3 }
```

### Async Helpers

```ts
import { sleep, debounce, throttle } from '@fantasizetech/fantasize-core';
await sleep(500);
const debounced = debounce(() => console.log('fire'), 300);
const throttled = throttle(() => console.log('tick'), 1000);
```

### Crypto

```ts
import { uuid, nanoid } from '@fantasizetech/fantasize-core';
uuid(); // v4 UUID
nanoid(); // ~21 char url-safe id
```

### Date

```ts
import { addDays, startOfDay, relativeTime } from '@fantasizetech/fantasize-core';
const tomorrow = addDays(new Date(), 1);
relativeTime(tomorrow); // in 1 day
```

## Error Strategy

- `DomainError`: deterministic business rule violation (retry usually NOT helpful).
- `ApiError`: remote / HTTP / integration layer issue (status + optional code).

## Design Notes

- No external runtime deps; relies only on Node built-ins.
- `Result` and `Option` keep flow explicit and composable.
- Date helpers intentionally simple (no timezone heavy lifting).

## License

MIT
