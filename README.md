# react-native-vibe-store

Tiny typed state for React Native. No Provider, reducers, action types, middleware, or selector boilerplate.

```tsx
import {createStore} from 'react-native-vibe-store';

export const cart = createStore({
  items: [] as {id: string; price: number}[],
  user: null as null | {name: string},
});

// Anywhere—inside or outside React.
cart.mutate(draft => {
  draft.items.push({id: 'milk', price: 57});
});

// In a component: subscribes only to `items`.
function CartCount() {
  const items = cart.use('items');
  return <Text>{items.length}</Text>;
}
```

## API

- `store.get()` — read anywhere.
- `store.set({key: value})` — shallow typed update.
- `store.mutate(draft => {})` — readable nested updates with an isolated draft.
- `store.batch(() => {})` — many writes, one notification.
- `store.use('key')` — React hook subscribed to one field.
- `store.select(selector)` — subscribe to derived data.

State is intentionally limited to plain objects, arrays, and primitives. Keep API clients, class instances, secrets, and navigation objects outside state.

## Why use this instead of Zustand or RTK?

Use Vibe Store when you want a small React Native app store with the least possible ceremony:

| | Vibe Store | Zustand | Redux Toolkit |
| --- | --- | --- | --- |
| Provider required | No | No | Usually yes |
| Define actions first | No | Yes | Yes |
| Nested write | `mutate(draft => ...)` | Custom action | Reducer/slice |
| Read one field | `store.use('items')` | Selector | Selector + hooks |
| Best for | App UI state | Flexible state architecture | Large, opinionated teams |

Vibe Store deliberately does **not** replace TanStack Query for server cache, Redux Toolkit for event-heavy enterprise workflows, or Zustand middleware/devtools. It is better when "I just need state" should stay easy.
