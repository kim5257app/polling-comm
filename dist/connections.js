"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const anyid_1 = require("anyid");
const connection_1 = require("./connection");
class Connections {
    constructor() {
        this.events = new events_1.EventEmitter();
        this.connList = new Map();
    }
    makeConnection() {
        let clientId;
        do {
            clientId = new anyid_1.AnyId()
                .encode('Aa0')
                .length(Connections.CLIENT_ID_LENGTH)
                .time('ms')
                .id();
        } while (Object.prototype.hasOwnProperty.call(this.connList, clientId));
        this.connList.set(clientId, new connection_1.default(clientId));
        this.events.emit('connected', this.connList.get(clientId));
        return clientId;
    }
    hasConnection(clientId) {
        return this.connList.has(clientId);
    }
}
exports.default = Connections;
Connections.CLIENT_ID_LENGTH = 8;
