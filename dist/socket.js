"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const debug = debug_1.default('polling-comm/socket');
class Socket {
    constructor(id, options) {
        // wait 요청에 대한 응답 객체
        this.waitRes = null;
        // emit 해야 할 데이터 목록
        this.emitList = [];
        // emit 해야 할 그룹 목록
        this.groupList = new Set();
        // 수신된 데이터에 대한 이벤트
        this.events = new events_1.EventEmitter();
        // use 함수로 등록된 middleware
        this.fns = [];
        this.id = id;
        this.groups = options.groups;
        this.waitInterval = (options.waitInterval) ? (options.waitInterval) : (10 * 1000);
        this.timeoutBase = this.waitInterval * 3;
        this.timeout = new Date().getTime() + this.timeoutBase;
        this.events.on('disconnected', () => {
            // TODO: 연결 해제된 경우 처리
        });
        this.events.on('recv', (packet) => {
            // 수신 처리
            this.run(packet, (error) => {
                if (error) {
                    this.emit('error', error);
                }
                else {
                    this.events.emit(packet.name, packet.data);
                }
            });
        });
    }
    run(packet, fn) {
        const fns = [...this.fns];
        function run(idx) {
            fns[idx](packet, (error) => {
                if (error) {
                    fn(error);
                }
                else if (fns[idx + 1] == null) {
                    fn();
                }
                else {
                    run(idx + 1);
                }
            });
        }
        if (fns.length <= 0) {
            fn();
        }
        else {
            run(0);
        }
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
    on(name, cb) {
        this.events.on(name, cb);
    }
    emit(name, data) {
        const packet = {
            name,
            data: JSON.stringify(data),
        };
        if (this.groupList.size > 0) {
            this.groupList.forEach((group) => {
                group.forEach((socket) => {
                    if (socket.id !== this.id) {
                        socket.emitList.push(packet);
                    }
                });
            });
        }
        else {
            this.emitList.push(packet);
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
