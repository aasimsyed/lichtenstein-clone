import { useCallback, useRef } from 'react';

/**
 * A custom hook that returns a memoized callback that has access to the latest state
 * without causing re-renders when dependencies change.
 * 
 * This is useful for event handlers that need to capture the latest state values
 * without being recreated when those values change.
 * 
 * @param callback The callback function to memoize
 * @returns A memoized version of the callback that never changes but always has access to latest state
 */
export function useEventCallback<Args extends unknown[], Return>(
  callback: (...args: Args) => Return
): (...args: Args) => Return {
  // Keep a ref to the latest callback function
  const callbackRef = useRef(callback);
  
  // Update the ref whenever the callback changes
  // This doesn't trigger re-renders in consumers
  callbackRef.current = callback;
  
  // Return a stable function reference that calls the latest version
  return useCallback((...args: Args) => {
    return callbackRef.current(...args);
  }, []);
} 