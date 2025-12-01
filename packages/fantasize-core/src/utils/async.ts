export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
) {
  let timeout: any;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  } as T;
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
) {
  let last = 0;
  let pending: any;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    } else if (!pending) {
      const remaining = wait - (now - last);
      pending = setTimeout(() => {
        last = Date.now();
        pending = null;
        fn.apply(this, args);
      }, remaining);
    }
  } as T;
}
