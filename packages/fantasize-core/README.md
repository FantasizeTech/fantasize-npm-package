# @fantasizetech/fantasize-core

Central hub for functional types and shared utilities (Result, Option, Either, Paginated, error classes, and object/date/crypto/async helpers) powering the Fantasize ecosystem. Requires Node 20+.

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

## Real-World Use Cases

Practical scenarios showing integration and composition patterns.

### 1. API Wrapper Returning `Result` + Mapping to Domain Errors

```ts
import { ok, err, Result, ApiError, DomainError, mapResult } from '@fantasizetech/fantasize-core';

interface UserDto {
  id: string;
  name: string;
}

async function fetchUser(id: string): Promise<Result<UserDto, ApiError>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return err(new ApiError(res.status, 'Fetch failed', 'USER_FETCH_FAILED'));
    return ok(await res.json());
  } catch (e) {
    return err(new ApiError(0, 'Network error', 'NETWORK', e));
  }
}

// Map transport-level error to domain-layer error at the service boundary
async function getUser(id: string): Promise<Result<UserDto, DomainError>> {
  const raw = await fetchUser(id);
  return mapResult(raw, (u) => u).ok // Ok path stays same
    ? raw
    : err(new DomainError('USER_UNAVAILABLE', raw.error.message));
}
```

### 2. Form Validation Pipeline (`Result`)

```ts
import { Result, ok, err } from '@fantasizetech/fantasize-core';

interface Registration {
  email: string;
  password: string;
}

function validateEmail(v: string): Result<string, DomainError> {
  return /.+@.+/.test(v) ? ok(v) : err(new DomainError('EMAIL_INVALID'));
}
function validatePassword(v: string): Result<string, DomainError> {
  return v.length >= 8 ? ok(v) : err(new DomainError('PASSWORD_TOO_SHORT'));
}

function validate(reg: Registration): Result<Registration, DomainError[]> {
  const errors: DomainError[] = [];
  const emailR = validateEmail(reg.email);
  if (!emailR.ok) errors.push(emailR.error);
  const passR = validatePassword(reg.password);
  if (!passR.ok) errors.push(passR.error);
  return errors.length ? err(errors) : ok(reg);
}
```

### 3. Cached Optional Value (`Option`) for Performance

```ts
import { Option, some, none, isSome, unwrapOr } from '@fantasizetech/fantasize-core';

let cachedSettings: Option<{ theme: string }> = none;

async function loadSettings() {
  if (isSome(cachedSettings)) return cachedSettings.value; // fast path
  const res = await fetch('/api/settings');
  const json = await res.json();
  cachedSettings = some(json);
  return json;
}

const theme = unwrapOr(cachedSettings, { theme: 'light' }).theme;
```

### 4. Pagination of Large Search Results (`Paginated<T>`) Client-Side

```ts
import { paginate } from '@fantasizetech/fantasize-core';
const all = await fetch('/api/products?limit=1000').then((r) => r.json());
const page3 = paginate(all, 3, 50); // items, hasNext, etc.
```

### 5. Debounced Live Search (UI) + Throttled Scroll Events

```ts
import { debounce, throttle } from '@fantasizetech/fantasize-core';

const search = debounce(async (q: string) => {
  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  console.log('Results', await r.json());
}, 300);

window.addEventListener('keyup', (e) => {
  if (e.target instanceof HTMLInputElement) search(e.target.value);
});

const reportScroll = throttle(() => {
  console.log('Scroll position', window.scrollY);
}, 1000);
window.addEventListener('scroll', reportScroll);
```

### 6. ID Generation for Optimistic UI Items

```ts
import { nanoid, uuid } from '@fantasizetech/fantasize-core';

// optimistic temp client id
const tempId = nanoid();
// server-side stable id (if needed)
const stableId = uuid();
```

### 7. Relative Time + Date Range Building

```ts
import { startOfDay, endOfDay, addDays, relativeTime } from '@fantasizetech/fantasize-core';
const todayStart = startOfDay(new Date());
const todayEnd = endOfDay(new Date());
const last7Start = addDays(todayStart, -6);
console.log(relativeTime(addDays(new Date(), 2))); // in 2 days
```

### 8. DomainError in Business Rule Enforcement

```ts
import { DomainError } from '@fantasizetech/fantasize-core';

function reserveStock(current: number, requested: number) {
  if (requested > current) throw new DomainError('INSUFFICIENT_STOCK');
  return current - requested;
}
```

> Use these patterns to keep code explicit, robust, and easy to extend across the ecosystem.

## License

MIT
