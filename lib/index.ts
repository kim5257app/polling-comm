import Debug from 'debug';

import Server from './server';
import Connections from './connections';

const debug = Debug('polling-comm');

export default class PollingComm {
  connections: Connections;

  server: Server;

  constructor(port: number) {
    this.connections = new Connections();
    this.server = new Server(port, this.connections);
  }
}
