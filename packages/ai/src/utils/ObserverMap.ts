export type ObserverCallback<K, V> = (operation: 'add' | 'delete' | 'update', key: K, value?: V) => void;

export class ObserverMap<K extends string | number | symbol, V> {
  private _map: Map<K, V>;
  private _observers: Set<ObserverCallback<K, V>> = new Set();

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    this._map = new Map(entries);
  }

  private notifyObservers(operation: 'add' | 'delete' | 'update', key: K, value?: V): void {
    for (const observer of this._observers) {
      observer(operation, key, value);
    }
  }

  observe(callback: ObserverCallback<K, V>): void {
    this._observers.add(callback);
  }

  unobserve(callback: ObserverCallback<K, V>): void {
    this._observers.delete(callback);
  }

  get(key: K): V | undefined {
    return this._map.get(key);
  }

  set(key: K, value: V): this {
    const notifyKey = this._map.has(key) ? 'update' : 'add';
    this._map.set(key, value);
    this.notifyObservers(notifyKey, key, value);
    return this;
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  delete(key: K): boolean {
    const value = this._map.get(key);
    const bol = this._map.delete(key);
    if (value) {
      this.notifyObservers('delete', key, value);
    }
    return bol;
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }

  keys(): IterableIterator<K> {
    return this._map.keys();
  }

  values(): IterableIterator<V> {
    return this._map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this._map.entries();
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this._map.forEach(callbackfn, thisArg);
  }
}
