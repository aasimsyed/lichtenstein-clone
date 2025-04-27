import { useCallback, useRef } from 'react';

/**
 * A custom hook that returns a debounced version of the provided function.
 * The debounced function will delay its execution until after the specified
 * delay has elapsed since the last time it was invoked.
 *
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the provided function
 */
export default function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  // Use a ref to store the timeout ID so it persists between renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create a memoized callback that clears the previous timeout
  // and sets a new one each time it's called
  return useCallback(
    (...args: Parameters<T>) => {
      // Clear the previous timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        fn(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [fn, delay]
  ) as T;
} 