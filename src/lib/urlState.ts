import { useCallback, useEffect, useState } from 'react';
import { useRoute } from './router';

/** Reads one view setting from the address bar (?key=value). */
export function readParam(key: string, fallback: string): string {
  return new URLSearchParams(window.location.search).get(key) ?? fallback;
}

/** A query string with one view setting set; the default is left out, other parameters stay. */
export function withParam(search: string, key: string, value: string, fallback: string): string {
  const p = new URLSearchParams(search);
  if (value === fallback) p.delete(key); else p.set(key, value);
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Writes one view setting into the address bar. */
export function writeParam(key: string, value: string, fallback: string): void {
  const url = `${window.location.pathname}${withParam(window.location.search, key, value, fallback)}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(window.history.state, '', url);
}

/**
 * A view setting kept in the URL (e.g. ?purpose_show=share), like the filters, so a copied link restores
 * exactly what the reader sees. Follows back/forward and navigation.
 */
export function useUrlState(key: string, fallback: string): [string, (v: string) => void] {
  const [value, setValue] = useState(() => readParam(key, fallback));
  const route = useRoute();
  useEffect(() => {
    const sync = () => setValue(readParam(key, fallback));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [key, fallback, route]);
  const set = useCallback((v: string) => { setValue(v); writeParam(key, v, fallback); }, [key, fallback]);
  return [value, set];
}
