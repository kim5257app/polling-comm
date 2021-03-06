/// <reference types="node" />
import * as http from 'http';
import * as express from 'express';
import { EventEmitter as Events } from 'events';
export interface ServerEventParam {
    req: express.Request;
    res: express.Response;
}
export default class Server {
    app: express.Express;
    server: http.Server | null;
    serverEvent: Events;
    constructor(port: number | express.Express, serverEvent: Events);
    private commRouter;
    close(): void;
}
