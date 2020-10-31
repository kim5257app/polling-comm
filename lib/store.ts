export interface SocketStore {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

export class MemStore implements SocketStore {
  private readonly store = new Map<string, any>()

  get(key: string): Promise<any> {
    return Promise.resolve(this.store.get(key));
  }

  set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
    return Promise.resolve();
  }
}
