import { useState, useEffect } from 'react';
import { useGenUI } from '../context';

/**
 * Subscribes to a StateStore path and re-renders when it changes.
 * Returns undefined if the path has no value yet.
 */
export function useStateValue<T = unknown>(path: string): T | undefined {
  const { stateStore } = useGenUI();
  const [value, setValue] = useState<T | undefined>(() => stateStore.get<T>(path));

  useEffect(() => {
    setValue(stateStore.get<T>(path));
    return stateStore.subscribe(path, () => setValue(stateStore.get<T>(path)));
  }, [stateStore, path]);

  return value;
}
