import Server from './server';
import Connections from './connections';
export default class PollingComm {
    connections: Connections;
    server: Server;
    constructor(port: number);
}
