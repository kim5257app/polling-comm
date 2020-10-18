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
    private readonly waitInterval;
    private readonly timeoutBase;
    private timeout;
    constructor(id: string, options: Options);
    wait({ req, res }: ServerEventParam): void;
    emit(name: string, data: string): void;
    to(group: string): Socket;
    private doProgress;
    private resetTimeout;
}
