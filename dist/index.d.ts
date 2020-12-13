/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import * as express from 'express';
import Server from './server';
import Socket, { Options as SocketOpts } from './socket';
import Groups from './groups';
import { ClusterOptions } from './cluster';
interface Options extends SocketOpts {
    app?: express.Express;
    port?: number;
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
    private groupList;
    private cluster;
    constructor(options: Options);
    private initServerEvents;
    private makeSocket;
    private run;
    on(name: 'connection', cb: (connection: any) => void): void;
    use(fn: (socket: Socket, next: (error?: any) => void) => void): void;
    emit(name: string, data: object, flag?: boolean): void;
    to(groupName: string): PollingComm;
    close(): void;
    setCluster(opts: ClusterOptions): void;
}
export {};
