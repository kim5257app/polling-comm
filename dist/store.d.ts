export interface SocketStore {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
export declare class MemStore implements SocketStore {
    private readonly store;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}
