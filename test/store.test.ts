import {describe, expect, it, vi} from 'vitest';
import {createStore} from '../src';

describe('createStore', () => {
  it('updates state without reducers or action types', () => {
    const cart = createStore({count: 0, items: [] as string[]});
    cart.set({count: 1});
    cart.mutate(draft => { draft.items.push('milk'); });
    expect(cart.get()).toEqual({count: 1, items: ['milk']});
  });

  it('notifies once for a batch and skips no-op shallow writes', () => {
    const store = createStore({count: 0, name: 'Yogesh'});
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({count: 0});
    store.batch(() => { store.set({count: 1}); store.set({name: 'Flow'}); });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual({count: 1, name: 'Flow'});
  });

  it('does not mutate the previous snapshot', () => {
    const store = createStore({cart: {items: ['milk']}});
    const before = store.get();
    store.mutate(draft => { draft.cart.items.push('bread'); });
    expect(before.cart.items).toEqual(['milk']);
  });
});
