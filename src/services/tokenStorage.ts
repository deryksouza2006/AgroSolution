import * as SecureStore from 'expo-secure-store';

export const TOKEN_KEY = 'citizentech_access_token';
// Serialize native storage operations so a pending write cannot undo a logout.
let pending: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(operation, operation);
  pending = next.catch(() => undefined);
  return next;
}

export const tokenStorage = {
  get: () => enqueue(() => SecureStore.getItemAsync(TOKEN_KEY)),
  set: (token: string) => enqueue(() => SecureStore.setItemAsync(TOKEN_KEY, token)),
  remove: () => enqueue(() => SecureStore.deleteItemAsync(TOKEN_KEY)),
};
