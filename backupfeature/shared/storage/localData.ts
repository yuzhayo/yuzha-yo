/**
 * Minimal placeholder for a shared local data store.
 * Extend or replace with IndexedDB/localStorage logic for your project.
 */
export type LocalDataStore<TValue> = {
  get: () => TValue | null;
  set: (value: TValue) => void;
  clear: () => void;
};

export function createLocalDataStore<TValue>(): LocalDataStore<TValue> {
  return {
    get: () => null,
    set: () => undefined,
    clear: () => undefined,
  };
}
