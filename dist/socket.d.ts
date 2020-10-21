/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import { ServerEventParam } from './server';
import Groups from './groups';
export interface Packet {
    name: string;
    data: string;
}
export interface Options {
    groups: Groups;
    waitInterval?: number;
}
export default class Socket {
    readonly id: string;
    private groups;
    private waitRes;
    private emitList;
    private groupList;
    events: Events;
    private fns;
    private readonly waitInterval;
    private readonly timeoutBase;
    private timeout;
    constructor(id: string, options: Options);
    private run;
    wait({ req, res }: ServerEventParam): void;
    on(name: string, cb: (data: object) => void): void;
    emit(name: string, data: object): void;
    to(group: string): Socket;
    join(groupName: string): Socket;
    leave(groupName: string): Socket;
    private doProgress;
    private resetTimeout;
}
