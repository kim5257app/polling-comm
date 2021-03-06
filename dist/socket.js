"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const store_1 = require("./store");
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
        this.cluster = options.cluster;
        this.store = (options.store != null) ? options.store : (new store_1.MemStore());
        this.waitInterval = (options.waitInterval) ? (options.waitInterval) : (60 * 1000);
        this.timeoutBase = this.waitInterval * 3;
        this.timeout = new Date().getTime() + this.timeoutBase;
        // 이벤트 최대 수 지정
        this.events.setMaxListeners(30);
        this.events.on('disconnected', () => {
            this.groups.leaveAll({ socket: this });
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
            var _a, _b, _c, _d;
            console.log(`res timestamp: ${(_a = req.res) === null || _a === void 0 ? void 0 : _a.getHeader('timestamp')}, ${(_b = this.waitRes) === null || _b === void 0 ? void 0 : _b.getHeader('timestamp')}`);
            if (((_c = req.res) === null || _c === void 0 ? void 0 : _c.getHeader('timestamp')) === ((_d = this.waitRes) === null || _d === void 0 ? void 0 : _d.getHeader('timestamp'))) {
                console.log(`closed by client: ${this.id}`);
                this.waitRes = null;
            }
        });
        this.resetTimeout();
        // wait 응답 처리
        console.log('Call doProgress by wait:', res.getHeader('timestamp'));
        this.doProgress();
    }
    on(name, cb) {
        this.events.on(name, cb);
    }
    use(fn) {
        this.fns.push(fn);
    }
    emit(name, data) {
        var _a;
        const packet = {
            name,
            data,
        };
        if (this.groupList.size > 0) {
            this.groupList.forEach((groupName) => {
                const socketList = this.groups.socketList.get(groupName);
                if (socketList != null) {
                    socketList.forEach((socket) => {
                        if (socket.id !== this.id) {
                            socket.emitList.push(packet);
                            socket.doProgress();
                        }
                    });
                }
            });
            // 다른 클러스터에도 전달 요청
            (_a = this.cluster) === null || _a === void 0 ? void 0 : _a.publish({
                channel: 'emit',
                data: {
                    groupList: [...this.groupList],
                    pkt: { name, data },
                },
            });
            this.groupList.clear();
        }
        else {
            this.emitList.push(packet);
            console.log('Call doProgress by emit');
            this.doProgress();
        }
    }
    to(groupName) {
        this.groupList.add(groupName);
        return this;
    }
    join(groupName) {
        this.groups.join({ groupName, socket: this });
        return this;
    }
    leave(groupName) {
        this.groups.leave({ groupName, socket: this });
        return this;
    }
    get(key) {
        return this.store.get(key);
    }
    set(key, value) {
        return this.store.set(key, value);
    }
    // wait 요청이 오면 emit 으로 수신된 데이터로 응답
    // emit 요청이 오면 wait 요청이 있을 경우 데이터로 응답
    doProgress() {
        var _a;
        console.log(`doProgress: ${(_a = this.waitRes) === null || _a === void 0 ? void 0 : _a.getHeader('timestamp')}, ${this.emitList.length}`);
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
    static checkTimeout(sockets) {
        const curTime = new Date().getTime();
        sockets.forEach((socket) => {
            if (socket.timeout < curTime) {
                socket.events.emit('disconnected');
                sockets.delete(socket.id);
            }
        });
    }
}
exports.default = Socket;
