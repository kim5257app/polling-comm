/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import Server from './server';
import Socket, { Options as SocketOpts } from './socket';
import Groups from './groups';
interface Options extends SocketOpts {
    port: number;
}
export default class PollingComm {
    private static readonly CLIENT_ID_LENGTH;
    server: Server;
    socketList: Map<string, Socket>;
    serverEvent: Events;
    event: Events;
    options: Options;
    groups: Groups;
    private fns;
    constructor(options: Options);
    private initServerEvents;
    private makeSocket;
    private run;
    on(name: 'connection', cb: (connection: any) => void): void;
    use(fn: (socket: Socket, next: (error?: any) => void) => void): void;
}
export {};
