"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const debug = debug_1.default('polling-comm/socket');
class Socket {
    constructor(id, options) {
        // wait 요청에 대한 응답 객체
        this.waitRes = null;
        // emit 해야 할 데이터 목록
        this.emitList = [];
        // emit 해야 할 그룹 목록
        this.groupList = new Set();
        this.id = id;
        this.groups = options.groups;
        this.waitInterval = (options.waitInterval) ? (options.waitInterval) : (10 * 1000);
        this.timeoutBase = this.waitInterval * 3;
        this.timeout = new Date().getTime() + this.timeoutBase;
    }
    wait({ req, res }) {
        this.waitRes = res;
        req.on('close', () => {
            debug('closed by client');
            this.waitRes = null;
        });
        this.resetTimeout();
        // wait 응답 처리
        this.doProgress();
    }
    emit(name, data) {
        if (this.groupList.size > 0) {
            this.groupList.forEach((group) => {
                group.forEach((socket) => {
                    if (socket.id !== this.id) {
                        socket.emit(name, data);
                    }
                });
            });
        }
        else {
            this.emitList.push({ name, data });
            this.doProgress();
        }
    }
    to(group) {
        const socketList = this.groups.socketList.get(group);
        if (socketList != null) {
            this.groupList.add(socketList);
        }
        return this;
    }
    // wait 요청이 오면 emit 으로 수신된 데이터로 응답
    // emit 요청이 오면 wait 요청이 있을 경우 데이터로 응답
    doProgress() {
        // wait 요청이 있으면서 emitList 안에 데이터가 있으면 처리
        if (this.waitRes != null && this.emitList.length > 0) {
            this.waitRes.status(200).json(this.emitList[0]);
            this.waitRes = null;
            this.emitList.splice(0, 1);
        }
    }
    resetTimeout() {
        this.timeout = new Date().getTime() + this.timeoutBase;
    }
}
exports.default = Socket;
