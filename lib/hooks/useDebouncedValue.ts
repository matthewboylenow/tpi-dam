import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 * Use for text filters so each keystroke doesn't fire a request.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
