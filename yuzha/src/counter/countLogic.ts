import React from "react";

type Listener = () => void;

const store = {
  value: 0,
  listeners: new Set<Listener>(),
};

const emit = () => {
  store.listeners.forEach((listener) => listener());
};

export const counterLogic = {
  subscribe(listener: Listener) {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  },
  getSnapshot() {
    return store.value;
  },
  increment() {
    store.value += 1;
    emit();
  },
  reset() {
    store.value = 0;
    emit();
  },
};

export function useCounterValue(): number {
  return React.useSyncExternalStore(counterLogic.subscribe, counterLogic.getSnapshot);
}
