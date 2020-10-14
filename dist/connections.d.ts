/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import Connection, { GroupManage, EventManage } from './connection';
import Group from './group';
export interface ConnectionsOptions {
    cleanupInterval?: number;
}
export default class Connections implements GroupManage, EventManage {
    private static readonly CLIENT_ID_LENGTH;
    options: {
        cleanupInterval: number;
    };
    events: Events;
    connList: Map<string, Connection>;
    groupList: Map<string, Group>;
    constructor(options: ConnectionsOptions);
    makeConnection(): string;
    hasConnection(clientId: string): boolean;
    join(groupName: string, clientId: string): void;
    leave(groupName: string, clientId: string): void;
    emit(name: string, data: any): void;
}
