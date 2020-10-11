/// <reference types="node" />
import { EventEmitter as Events } from 'events';
import Connection from './connection';
export default class Connections {
    private static readonly CLIENT_ID_LENGTH;
    events: Events;
    connList: Map<string, Connection>;
    makeConnection(): string;
    hasConnection(clientId: string): boolean;
}
