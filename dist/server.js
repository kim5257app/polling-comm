"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const http = require("http");
const express = require("express");
const debug = debug_1.default('polling-comm/server');
class Server {
    constructor(port, connections) {
        this.app = express();
        this.app.set('port', port);
        this.app.use('/comm', this.commRouter());
        this.server = http.createServer(this.app);
        this.connections = connections;
    }
    commRouter() {
        const router = express.Router();
        router.get('/connect', ((req, res) => {
            try {
                const clientId = this.connections.makeClientId();
                debug('New connection:', clientId);
                res.status(200).json({
                    result: 'success',
                    clientId,
                });
            }
            catch (error) {
                res.status(400).json(error);
            }
        }));
        router.post('/emit', ((req, res) => {
            try {
            }
            catch (error) {
                res.status(400).json(error);
            }
        }));
        router.get('/wait', ((req, res) => {
        }));
        return router;
    }
}
exports.default = Server;
