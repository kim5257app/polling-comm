/// <reference types="node" />
import * as http from 'http';
import * as express from 'express';
import Connections from './connections';
export default class Server {
    app: express.Express;
    server: http.Server;
    connections: Connections;
    constructor(port: number, connections: Connections);
    private commRouter;
}
