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
        });
        this.serverEvent.on('wait', ({ req, res }) => {
            var _a;
            try {
                const id = req.header('id');
                if (id == null) {
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else if (!this.socketList.has(id)) {
                    debug(`Disconnected: ${id}`);
                }
                else {
                    (_a = this.socketList.get(id)) === null || _a === void 0 ? void 0 : _a.wait({ req, res });
                }
            }
            catch (error) {
                res.status(400).json(js_error_1.default.make(error));
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
    on(name, cb) {
        this.event.on(name, cb);
    }
}
exports.default = PollingComm;
PollingComm.CLIENT_ID_LENGTH = 8;
