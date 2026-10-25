import {useSyncExternalStore} from 'react';

type Updater<S> = Partial<S> | ((state: Readonly<S>) => Partial<S> | S);
type Listener = () => void;

export type VibeStore<S extends object> = Readonly<{
  get(): Readonly<S>;
  set(next: Updater<S>): void;
  /** Mutate an isolated draft—ideal for short, readable app actions. */
  mutate(recipe: (draft: S) => void): void;
  /** Coalesce several writes into one React notification. */
  batch(work: () => void): void;
  /** One field: const items = cart.use('items') */
  use<K extends keyof S>(key: K): S[K];
  /** Derived data: const total = cart.select(s => s.items.length) */
  select<T>(selector: (state: Readonly<S>) => T, equal?: (a: T, b: T) => boolean): T;
  subscribe(listener: Listener): () => void;
}>;

function clone<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (Array.isArray(value)) {
    const copy: unknown[] = []; seen.set(value, copy);
    value.forEach(item => copy.push(clone(item, seen)));
    return copy as T;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError('vibe-store state must be plain objects, arrays, and primitives.');
  const copy: Record<string, unknown> = {}; seen.set(value, copy);
  Object.entries(value).forEach(([key, item]) => { copy[key] = clone(item, seen); });
  return copy as T;
}

function shallowEqual(a: object, b: object): boolean {
  const aKeys = Object.keys(a); const bKeys = Object.keys(b);
  return aKeys.length === bKeys.length && aKeys.every(key => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
}

/** Create one store. No provider, reducers, action types, or middleware ceremony. */
export function createStore<S extends object>(initial: S): VibeStore<S> {
  let state = clone(initial);
  let depth = 0;
  let changed = false;
  const listeners = new Set<Listener>();
  const notify = () => { if (depth) { changed = true; return; } listeners.forEach(listener => listener()); };
  const write = (next: S) => { if (shallowEqual(state, next)) return; state = next; notify(); };
  const subscribe = (listener: Listener) => { listeners.add(listener); return () => listeners.delete(listener); };

  function use<K extends keyof S>(key: K): S[K] {
    return useSyncExternalStore(subscribe, () => state[key], () => state[key]);
  }

  return Object.freeze({
    get: () => state,
    set(next) { const patch = typeof next === 'function' ? next(state) : next; write({...state, ...patch} as S); },
    mutate(recipe) { const draft = clone(state); recipe(draft); write(draft); },
    batch(work) { depth += 1; try { work(); } finally { depth -= 1; if (!depth && changed) { changed = false; listeners.forEach(listener => listener()); } } },
    use,
    select(selector, equal = Object.is) {
      let cached = selector(state);
      return useSyncExternalStore(subscribe, () => { const next = selector(state); if (!equal(cached, next)) cached = next; return cached; }, () => cached);
    },
    subscribe,
  });
}
