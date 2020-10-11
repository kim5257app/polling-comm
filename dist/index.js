"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const server_1 = require("./server");
const connections_1 = require("./connections");
const debug = debug_1.default('polling-comm');
class PollingComm {
    constructor(port) {
        this.connections = new connections_1.default();
        this.server = new server_1.default(port, this.connections);
    }
}
exports.default = PollingComm;
