"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const anyid_1 = require("anyid");
const js_error_1 = require("@kim5257/js-error");
const server_1 = require("./server");
const socket_1 = require("./socket");
const groups_1 = require("./groups");
const debug = debug_1.default('polling-comm');
class PollingComm {
    constructor(options) {
        // Socket 목록
        this.socketList = new Map();
        // 웹 요청 처리자
        this.serverEvent = new events_1.EventEmitter();
        // 외부 이벤트 전달자
        this.event = new events_1.EventEmitter();
        // 그룹 관리 객체
        this.groups = new groups_1.default();
        this.fns = [];
        this.options = {
            ...options,
            groups: this.groups,
        };
        this.initServerEvents();
        this.server = new server_1.default(options.port, this.serverEvent);
    }
    initServerEvents() {
        this.serverEvent.on('connect', ({ res }) => {
            try {
                // 새로운 연결 생성 및 'connection' 이벤트 전달
                const socket = this.makeSocket();
                debug('New socket:', socket.id);
                this.event.emit('connection', socket);
                res.status(200).json({
                    result: 'success',
                    clientId: socket.id,
                });
            }
            catch (error) {
                res.status(400).json(js_error_1.default.make(error));
            }
        });
        this.serverEvent.on('emit', ({ req, res }) => {
            try {
                const id = req.header('id');
                if (id == null) {
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else {
                    const socket = this.socketList.get(id);
                    if (socket != null) {
                        // 데이터 수신 이벤트 발생
                        socket.events.emit('recv', req.body);
                        res.status(200).json({ result: 'success' });
                    }
                    else {
                        debug(`Disconnected: ${id}`);
                        js_error_1.default.throwFail('ERR_GONE', 'This id isn\'t available', 410);
                    }
                }
            }
            catch (error) {
                const code = (error.code != null && error.code > 200) ? error.code : 500;
                res.status(code).json(js_error_1.default.make(error));
            }
        });
        this.serverEvent.on('wait', ({ req, res }) => {
            try {
                const id = req.header('id');
                if (id == null) {
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else {
                    const socket = this.socketList.get(id);
                    if (socket != null) {
                        socket.wait({ req, res });
                    }
                    else {
                        debug(`Disconnected: ${id}`);
                        js_error_1.default.throwFail('ERR_GONE', 'This id isn\'t available', 410);
                    }
                }
            }
            catch (error) {
                const code = (error.code != null && error.code > 200) ? error.code : 500;
                res.status(code).json(js_error_1.default.make(error));
            }
        });
    }
    makeSocket() {
        let clientId;
        do {
            clientId = new anyid_1.AnyId()
                .encode('Aa0')
                .length(PollingComm.CLIENT_ID_LENGTH)
                .time('ms')
                .id();
        } while (this.socketList.has(clientId));
        const socket = new socket_1.default(clientId, this.options);
        this.socketList.set(clientId, socket);
        return socket;
    }
    run(socket, fn) {
        const fns = [...this.fns];
        function run(idx) {
            fns[idx](socket, (error) => {
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
    on(name, cb) {
        this.event.on(name, cb);
    }
    use(fn) {
        this.fns.push(fn);
    }
}
exports.default = PollingComm;
PollingComm.CLIENT_ID_LENGTH = 8;
