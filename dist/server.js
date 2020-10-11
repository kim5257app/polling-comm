"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const http = require("http");
const express = require("express");
const js_error_1 = require("@kim5257/js-error");
const debug = debug_1.default('polling-comm/server');
class Server {
    constructor(port, connections) {
        this.app = express();
        this.app.set('port', port);
        this.app.use('/comm', this.commRouter());
        this.server = http.createServer(this.app);
        this.connections = connections;
        this.server.listen(port);
    }
    commRouter() {
        const router = express.Router();
        router.get('/connect', ((req, res) => {
            try {
                const clientId = this.connections.makeConnection();
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
                const clientId = req.header('id');
                if (clientId == null) {
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else if (!this.connections.hasConnection(clientId)) {
                    js_error_1.default.throwFail('ERR_GONE', 'No connection this clientID', 400);
                }
                else {
                    const payload = req.body;
                    const connection = this.connections.connList.get(clientId);
                    connection === null || connection === void 0 ? void 0 : connection.recv('recv', payload);
                }
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
