// Node 26 exposes an unavailable global localStorage unless a file is configured,
// and that value shadows jsdom's implementation in Angular's Vitest environment.
const entries = new Map<string, string>();
const testLocalStorage: Storage = {
  get length() {
    return entries.size;
  },
  clear() {
    entries.clear();
  },
  getItem(key) {
    return entries.get(String(key)) ?? null;
  },
  key(index) {
    return [...entries.keys()][index] ?? null;
  },
  removeItem(key) {
    entries.delete(String(key));
  },
  setItem(key, value) {
    entries.set(String(key), String(value));
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: testLocalStorage,
  });
}
