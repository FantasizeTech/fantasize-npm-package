import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

export type ValidationIssue = {
  path: Array<string | number>;
  message: string;
  code?: string;
};

export class ValidationError extends Error {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(issues[0]?.message ?? 'Validation failed');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export type SafeParseSuccess<T> = { success: true; data: T };
export type SafeParseFailure = { success: false; error: ValidationError };
export type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

export type Schema<T> = {
  parse(input: unknown): T;
  safeParse(input: unknown): SafeParseResult<T>;
};

type Infer<TSchema> = TSchema extends Schema<infer TValue> ? TValue : never;

const ok = <T>(data: T): SafeParseSuccess<T> => ({ success: true, data });
const err = (issues: ValidationIssue | ValidationIssue[]): SafeParseFailure => {
  const list = Array.isArray(issues) ? issues : [issues];
  return { success: false, error: new ValidationError(list) };
};

const prependPath = (issues: ValidationIssue[], prefix: string | number) =>
  issues.map((issue) => ({ ...issue, path: [prefix, ...issue.path] }));

export const string = (options?: { minLength?: number; maxLength?: number; trim?: boolean }): Schema<string> => ({
  safeParse(input: unknown) {
    if (typeof input !== 'string') {
      return err({ path: [], message: 'Expected string', code: 'invalid_type' });
    }
    let value = input;
    if (options?.trim) value = value.trim();
    if (options?.minLength !== undefined && value.length < options.minLength) {
      return err({ path: [], message: `Expected at least ${options.minLength} characters`, code: 'too_small' });
    }
    if (options?.maxLength !== undefined && value.length > options.maxLength) {
      return err({ path: [], message: `Expected at most ${options.maxLength} characters`, code: 'too_big' });
    }
    return ok(value);
  },
  parse(input: unknown) {
    const result = this.safeParse(input);
    if (!result.success) throw result.error;
    return result.data;
  },
});

export const number = (): Schema<number> => ({
  safeParse(input: unknown) {
    if (typeof input !== 'number' || Number.isNaN(input) || !Number.isFinite(input)) {
      return err({ path: [], message: 'Expected number', code: 'invalid_type' });
    }
    return ok(input);
  },
  parse(input: unknown) {
    const result = this.safeParse(input);
    if (!result.success) throw result.error;
    return result.data;
  },
});

export const email = (): Schema<string> => {
  const base = string({ trim: true });
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return {
    safeParse(input: unknown) {
      const res = base.safeParse(input);
      if (!res.success) return res;
      if (!emailRegex.test(res.data)) {
        return err({ path: [], message: 'Invalid email', code: 'invalid_email' });
      }
      return ok(res.data);
    },
    parse(input: unknown) {
      const result = this.safeParse(input);
      if (!result.success) throw result.error;
      return result.data;
    },
  };
};

export const array = <TItem>(item: Schema<TItem>): Schema<TItem[]> => ({
  safeParse(input: unknown) {
    if (!Array.isArray(input)) {
      return err({ path: [], message: 'Expected array', code: 'invalid_type' });
    }
    const collectedIssues: ValidationIssue[] = [];
    const output: TItem[] = [];
    input.forEach((value, idx) => {
      const result = item.safeParse(value);
      if (result.success) output.push(result.data);
      else collectedIssues.push(...prependPath(result.error.issues, idx));
    });
    if (collectedIssues.length) return err(collectedIssues);
    return ok(output);
  },
  parse(input: unknown) {
    const result = this.safeParse(input);
    if (!result.success) throw result.error;
    return result.data;
  },
});

export const record = <TShape extends Record<string, Schema<any>>>(shape: TShape): Schema<{ [K in keyof TShape]: Infer<TShape[K]> }> => ({
  safeParse(input: unknown) {
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      return err({ path: [], message: 'Expected object', code: 'invalid_type' });
    }
    const collectedIssues: ValidationIssue[] = [];
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(shape)) {
      const schema = shape[key];
      const value = (input as Record<string, unknown>)[key];
      const result = schema.safeParse(value);
      if (result.success) output[key] = result.data;
      else collectedIssues.push(...prependPath(result.error.issues, key));
    }

    if (collectedIssues.length) return err(collectedIssues);
    return ok(output as { [K in keyof TShape]: Infer<TShape[K]> });
  },
  parse(input: unknown) {
    const result = this.safeParse(input);
    if (!result.success) throw result.error;
    return result.data;
  },
});

export const parse = <T>(schema: Schema<T>, input: unknown): T => schema.parse(input);
export const safeParse = <T>(schema: Schema<T>, input: unknown): SafeParseResult<T> => schema.safeParse(input);

const issuesToErrorMap = <TValues>(error: ValidationError): FormErrors<TValues> => {
  const flattened: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_root';
    if (!flattened[key]) flattened[key] = issue.message;
  }
  return flattened as FormErrors<TValues>;
};

const extractValue = (input: unknown): unknown => {
  if (input && typeof input === 'object' && 'target' in input) {
    const target = (input as any).target;
    if (target && 'value' in target) {
      const type = target.type;
      if (type === 'number' || type === 'range') {
        const raw = target.value;
        return raw === '' ? '' : Number(raw);
      }
      if (type === 'checkbox') return Boolean(target.checked);
      return target.value;
    }
  }
  return input;
};

export type FormErrors<T> = Partial<Record<keyof T | string, string>> & { _root?: string };

export type UseValidationOptions<TValues> = {
  initialValues: TValues;
  validateOnChange?: boolean;
  onSubmit?: (values: TValues) => void | Promise<void>;
};

export type UseValidationResult<TValues extends Record<string, any>> = {
  values: TValues;
  errors: FormErrors<TValues>;
  setField: <K extends keyof TValues>(key: K, value: TValues[K]) => void;
  setValues: (values: TValues) => void;
  register: <K extends keyof TValues>(key: K) => {
    name: string;
    value: TValues[K];
    onChange: (next: unknown) => void;
  };
  validate: (nextValues?: TValues) => SafeParseResult<TValues>;
  handleSubmit: (submit?: (values: TValues) => void | Promise<void>) => (event?: FormEvent<HTMLFormElement>) => Promise<SafeParseResult<TValues>>;
  reset: (nextValues?: TValues) => void;
};

export function useValidation<TValues extends Record<string, any>>(
  schema: Schema<TValues>,
  options: UseValidationOptions<TValues>
): UseValidationResult<TValues> {
  const { initialValues, validateOnChange = false, onSubmit } = options;
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors<TValues>>({});

  const runValidation = useCallback(
    (nextValues: TValues): SafeParseResult<TValues> => {
      const result = schema.safeParse(nextValues);
      if (result.success) {
        setErrors({});
      } else {
        setErrors(issuesToErrorMap<TValues>(result.error));
      }
      return result;
    },
    [schema]
  );

  const setField = useCallback(
    <K extends keyof TValues>(key: K, value: TValues[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        if (validateOnChange) runValidation(next);
        return next;
      });
    },
    [runValidation, validateOnChange]
  );

  const register = useCallback(
    <K extends keyof TValues>(key: K) => ({
      name: String(key),
      value: values[key],
      onChange: (next: unknown) => {
        const resolved = extractValue(next);
        setField(key, resolved as TValues[K]);
      },
    }),
    [setField, values]
  );

  const validate = useCallback(
    (nextValues?: TValues) => {
      const snapshot = nextValues ?? values;
      return runValidation(snapshot);
    },
    [runValidation, values]
  );

  const handleSubmit = useCallback(
    (submit?: (vals: TValues) => void | Promise<void>) => {
      return async (event?: FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        const result = runValidation(values);
        if (result.success) {
          await (submit ?? onSubmit)?.(result.data);
        }
        return result;
      };
    },
    [onSubmit, runValidation, values]
  );

  const reset = useCallback((nextValues?: TValues) => {
    setValues(nextValues ?? initialValues);
    setErrors({});
  }, [initialValues]);

  return useMemo(
    () => ({
      values,
      errors,
      setField,
      setValues,
      register,
      validate,
      handleSubmit,
      reset,
    }),
    [errors, handleSubmit, register, reset, setField, setValues, validate, values]
  );
}
