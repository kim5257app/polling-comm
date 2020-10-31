"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemStore = void 0;
class MemStore {
    constructor() {
        this.store = new Map();
    }
    get(key) {
        return Promise.resolve(this.store.get(key));
    }
    set(key, value) {
        this.store.set(key, value);
        return Promise.resolve();
    }
}
exports.MemStore = MemStore;
