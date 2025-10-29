/**
 * Custom Hook: useLocalStorage
 * 
 * AI AGENT NOTES:
 * - Generic hook for managing localStorage with React state
 * - Automatically syncs state with localStorage
 * - Handles JSON serialization/deserialization
 * - Error handling for localStorage failures
 * 
 * Usage:
 * const [value, setValue] = useLocalStorage<Type>('key', defaultValue);
 * 
 * Features:
 * - Type-safe with TypeScript generics
 * - Auto-updates on value change
 * - Graceful error handling
 * - SSR compatible (checks for window)
 * 
 * When modifying:
 * - Keep error handling in place
 * - Test with localStorage disabled (privacy mode)
 */

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Error loading key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error setting key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
