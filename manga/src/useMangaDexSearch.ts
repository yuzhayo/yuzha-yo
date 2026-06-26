import { useState, useEffect, useCallback, useRef } from "react";
import type { MangaDexManga } from "./types";
import { searchManga } from "./mangaDexApi";

export type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "ready"; results: MangaDexManga[]; query: string }
  | { status: "error"; message: string };

export function useMangaDexSearch() {
  const [query, setQueryState] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clearSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQueryState("");
    setState({ status: "idle" });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "searching" });

    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchManga(trimmed);
        setState({ status: "ready", results, query: trimmed });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Search failed. Please try again.",
        });
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { state, query, setQuery, clearSearch };
}
