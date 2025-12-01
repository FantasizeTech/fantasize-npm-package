# @fantasizetech/fantasize-validation

Featherweight schema validation with a Zod-style API, zero dependencies, and a tiny React form hook. Perfect when Yup/Zod are too heavy.

## Features

- Minimal primitives: `string`, `number`, `email`, `record`, `array`
- `parse` / `safeParse` with structured issues and `ValidationError`
- Zero deps, tree-shakeable, works in Node + browser
- React hook `useValidation` for quick form validation without extra wiring

## Install

```bash
npm i @fantasizetech/fantasize-validation
```

Peer dependency:

```bash
npm i react react-dom
```

## Quick Start

```ts
import { string, number, email, record, parse, safeParse } from '@fantasizetech/fantasize-validation';

const userSchema = record({
  name: string({ minLength: 2 }),
  age: number(),
  email: email(),
});

// Throws on failure
const user = parse(userSchema, { name: 'Kai', age: 30, email: 'kai@example.com' });

// Safe alternative
const result = safeParse(userSchema, { name: 'K', age: 'not-a-number', email: 'nope' });
if (!result.success) {
  console.log(result.error.issues);
  // -> [{ path: ['age'], message: 'Expected number' }, { path: ['email'], message: 'Invalid email' }]
}
```

## Schemas

- `string(options?)`: validates strings, with optional `minLength`, `maxLength`, `trim`
- `number()`: validates finite numbers
- `email()`: validates email strings (trims first)
- `array(itemSchema)`: validates arrays of the given schema
- `record(shape)`: validates an object shape `{ key: schema }`

Helpers:

- `parse(schema, value)`: returns typed data or throws `ValidationError`
- `safeParse(schema, value)`: returns `{ success: true, data }` or `{ success: false, error }`

## React Form Hook

`useValidation` keeps values + errors together and wires change/submit handlers.

```tsx
import React from 'react';
import { string, email, record, useValidation } from '@fantasizetech/fantasize-validation';

const schema = record({
  name: string({ minLength: 2 }),
  email: email(),
});

export function SignupForm() {
  const { values, errors, register, handleSubmit } = useValidation(schema, {
    initialValues: { name: '', email: '' },
    validateOnChange: true,
    onSubmit: (data) => console.log('submit', data),
  });

  return (
    <form onSubmit={handleSubmit()}>
      <label>
        Name
        <input {...register('name')} />
        {errors.name && <small>{errors.name}</small>}
      </label>
      <label>
        Email
        <input {...register('email')} />
        {errors.email && <small>{errors.email}</small>}
      </label>
      <button type="submit">Create account</button>
    </form>
  );
}
```

Hook API:

- `values`: current form values
- `errors`: keyed by field or `_root`
- `register(field)`: returns `{ name, value, onChange }` ready for inputs
- `setField(key, value)`: set a single field (optionally re-validates)
- `validate(nextValues?)`: run validation and populate errors
- `handleSubmit(fn?)`: returns submit handler; uses `onSubmit` from options if provided
- `reset(nextValues?)`: reset values + clear errors

## Error Shape

`ValidationError.issues` is an array:

```ts
type ValidationIssue = {
  path: Array<string | number>; // e.g. ['address', 'city'] or [0, 'email']
  message: string;
  code?: string; // small hint like invalid_type | invalid_email
};
```

## Rationale

- Keep bundles tiny but ergonomic
- Favor readable error paths for form UX
- No runtime dependencies, just TypeScript + React peer

## Engines

- Node: `>=20`
