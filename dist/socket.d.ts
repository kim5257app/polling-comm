/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import { ServerEventParam } from './server';
import { SocketStore } from './store';
import Groups from './groups';
import Cluster from './cluster';
export interface Packet {
    name: string;
    data: any;
}
export interface Options {
    groups: Groups;
    store?: SocketStore;
    waitInterval?: number;
    cluster?: Cluster;
}
export default class Socket {
    readonly id: string;
    private groups;
    private cluster;
    private waitRes;
    private emitList;
    private groupList;
    events: Events;
    private fns;
    private readonly waitInterval;
    private readonly timeoutBase;
    private timeout;
    private store;
    constructor(id: string, options: Options);
    private run;
    wait({ req, res }: ServerEventParam): void;
    on(name: string, cb: (data: object) => void): void;
    use(fn: (packet: Packet, next: (error?: Error) => void) => void): void;
    emit(name: string, data: object): void;
    to(groupName: string): Socket;
    join(groupName: string): Socket;
    leave(groupName: string): Socket;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    private doProgress;
    private resetTimeout;
    static checkTimeout(sockets: Map<string, Socket>): void;
}
