"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Group {
    constructor() {
        this.connList = [];
    }
    emit(name, payload) {
        this.connList.forEach((conn) => {
            conn.emit(name, payload);
        });
    }
    add(connection) {
        if (!this.hasConnection(connection)) {
            this.connList.push(connection);
        }
    }
    remove(connection) {
        const idx = this.connList.findIndex((item) => item.id === connection.id);
        if (idx >= 0) {
            this.connList.splice(idx, 1);
        }
    }
    hasConnection(connection) {
        return (this.connList.findIndex((item) => item.id === connection.id) >= 0);
    }
    length() {
        return this.connList.length;
    }
}
exports.default = Group;
