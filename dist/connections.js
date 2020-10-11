"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anyid_1 = require("anyid");
class Connections {
    constructor() {
        this.connList = {};
    }
    makeClientId() {
        let clientId;
        do {
            clientId = new anyid_1.AnyId()
                .encode('Aa0')
                .length(Connections.CLIENT_ID_LENGTH)
                .time('ms')
                .id();
        } while (Object.prototype.hasOwnProperty.call(this.connList, clientId));
        return clientId;
    }
}
exports.default = Connections;
Connections.CLIENT_ID_LENGTH = 8;
