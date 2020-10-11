"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const debug = debug_1.default('polling-comm/connection');
class Connection {
    // wait 요청 결과
    constructor(id) {
        // 이벤트 목록
        this.events = new events_1.EventEmitter();
        // 그룹 목록
        this.groupList = [];
        // 전송 데이터 큐
        this.emitList = [];
        this.id = id;
    }
    recv(eventName, payload) {
        this.events.emit(eventName, payload);
    }
    emit(eventName, payload) {
        debug(`[${this.id}][${eventName}]: ${JSON.stringify(payload)}`);
        this.emitList.push({ eventName, payload });
        this.doProgress();
    }
    on(eventName, cb) {
        debug(`[${this.id}] listen on ${eventName}`);
        cb(eventName, {});
    }
    join(groupName) {
    }
    leave(groupName) {
    }
    doProgress() {
    }
}
exports.default = Connection;
