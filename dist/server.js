"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
class Server {
    constructor(port, serverEvent) {
        this.app = express();
        this.app.set('port', port);
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use('/comm', this.commRouter());
        this.server = http.createServer(this.app);
        this.server.listen(port);
        this.serverEvent = serverEvent;
    }
    commRouter() {
        const router = express.Router();
        router.get('/connect', ((req, res) => {
            this.serverEvent.emit('connect', { req, res });
        }));
        router.post('/emit', ((req, res) => {
            this.serverEvent.emit('emit', { req, res });
        }));
        router.get('/wait', ((req, res) => {
            this.serverEvent.emit('wait', { req, res });
        }));
        return router;
    }
}
exports.default = Server;
