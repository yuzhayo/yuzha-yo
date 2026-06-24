import type { HistoryEntry } from "./types";

const STORAGE_KEY = "manga_history_v1";
const MAX_ENTRIES = 50;

function loadAll(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveAll(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function saveHistory(entry: HistoryEntry): void {
  const entries = loadAll().filter((e) => e.key !== entry.key);
  entries.unshift(entry);
  saveAll(entries.slice(0, MAX_ENTRIES));
}

export function loadHistory(): HistoryEntry[] {
  return loadAll();
}

export function getHistoryEntry(key: string): HistoryEntry | undefined {
  return loadAll().find((e) => e.key === key);
}

export function deleteHistoryEntry(key: string): void {
  saveAll(loadAll().filter((e) => e.key !== key));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
