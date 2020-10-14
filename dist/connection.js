"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const debug = debug_1.default('polling-comm/connection');
class Connection {
    constructor(id, options) {
        // 이벤트 목록
        this.events = new events_1.EventEmitter();
        // 전송 데이터 큐
        this.emitList = [];
        // wait 요청 결과
        this.waitRequest = { req: null, res: null };
        // 가입된 그룹 목록
        this.groupList = [];
        // 미들웨어 함수 목록
        this.fns = [];
        this.id = id;
        this.options = Object.assign({ closeTimeout: 30000 }, options);
        this.timeout = new Date().getTime() + this.options.closeTimeout;
        // 기본 이벤트 등록
        this.events.on('disconnected', () => {
            var _a;
            (_a = this.eventManage) === null || _a === void 0 ? void 0 : _a.emit('cleanup', this.id);
        });
        this.events.on('recv', (payload) => {
            this.run(payload, (error) => {
                if (error) {
                    this.emit('error', error);
                }
                else {
                    this.events.emit(payload.name, payload.data);
                }
            });
        });
    }
    run(payload, fn) {
        const fns = [...this.fns];
        if (fns.length <= 0) {
            fn(null);
        }
        function run(idx) {
            fns[idx](payload, (error) => {
                if (error) {
                    fn(error);
                }
                else if (fns[idx + 1] == null) {
                    fn(null);
                }
                run(idx + 1);
            });
        }
        run(0);
    }
    recv(eventName, payload) {
        this.events.emit(eventName, payload);
    }
    wait(req, res) {
        this.waitRequest.req = req;
        this.waitRequest.res = res;
        req.on('close', () => {
            debug('Close wait request');
            this.waitRequest.res = null;
        });
        this.resetTimeout();
        this.doProgress();
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
        var _a;
        (_a = this.groupManage) === null || _a === void 0 ? void 0 : _a.join(groupName, this.id);
        this.groupList.push(groupName);
    }
    leave(groupName) {
        var _a;
        (_a = this.groupManage) === null || _a === void 0 ? void 0 : _a.leave(groupName, this.id);
        const idx = this.groupList.findIndex((item) => (groupName === item));
        if (idx >= 0) {
            this.groupList.splice(idx, 1);
        }
    }
    doProgress() {
        // 클라이언트로부터 wait 요청 수신 및 응답 대기 중이면서,
        // 클라이언트에 보내야 할 데이터가 있을 경우 처리
        if (this.waitRequest.res != null && this.emitList.length > 0) {
            const { res } = this.waitRequest;
            const payload = this.emitList[0];
            res.status(200).json(payload);
            this.waitRequest.res = null;
            this.emitList.splice(0, 1);
        }
    }
    resetTimeout() {
        this.timeout = new Date().getTime() + this.options.closeTimeout;
    }
}
exports.default = Connection;
