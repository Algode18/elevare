import { useCallback, useState } from "react";

const STORAGE_KEY = "elevare:recent-searches";
const MAX_ITEMS = 3;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function labelFor(filters) {
  const parts = [];
  if (filters.searchQuery) parts.push(`"${filters.searchQuery}"`);
  if (filters.job_type) parts.push(filters.job_type);
  if (filters.work_mode) parts.push(filters.work_mode);
  if (filters.location) parts.push(filters.location);
  return parts.join(" · ");
}

// Recent searches — a plain record of filter combinations the person has
// actually applied on this browser, kept in localStorage. This is not a
// recommendation engine or saved-search backend feature; it's quick recall
// of real past searches, one click to reapply.
export default function useRecentSearches() {
  const [recent, setRecent] = useState(() => readStore());

  const record = useCallback((filters) => {
    const label = labelFor(filters);
    if (!label) return;
    setRecent((prev) => {
      const withoutDupe = prev.filter((r) => r.label !== label);
      const next = [{ label, filters }, ...withoutDupe].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage failures (private browsing, quota, etc.) — the
        // feature just degrades to "no recent searches" for this session.
      }
      return next;
    });
  }, []);

  return { recent, record };
}