"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const events_1 = require("events");
const anyid_1 = require("anyid");
const js_error_1 = require("@kim5257/js-error");
const server_1 = require("./server");
// eslint-disable-next-line import/no-cycle
const socket_1 = require("./socket");
// eslint-disable-next-line import/no-cycle
const groups_1 = require("./groups");
// eslint-disable-next-line import/no-cycle
const cluster_1 = require("./cluster");
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
        // emit 해야 할 그룹 목록
        this.groupList = new Set();
        this.cluster = null;
        this.options = {
            ...options,
            groups: this.groups,
        };
        this.initServerEvents();
        if (options.port != null) {
            this.server = new server_1.default(options.port, this.serverEvent);
        }
        else if (options.app != null) {
            this.server = new server_1.default(options.app, this.serverEvent);
        }
        else {
            throw js_error_1.default.makeFail('WRONG_ARGS', 'Wrong Arguments');
        }
    }
    initServerEvents() {
        this.serverEvent.on('connect', ({ res }) => {
            try {
                // 새로운 연결 생성
                const socket = this.makeSocket();
                debug('New socket:', socket.id);
                // NOTE: run 함수를 호출하여 use 함수로 등록한 middleware 함수를 호출
                // 모든 middleware 함수 호출 후 에러 없으면, 연결 완료
                // 자세한 부분은 run 함수 참조
                this.run(socket, (error) => {
                    if (error) {
                        js_error_1.default.throwError(error);
                    }
                    else {
                        // 'connection' 이벤트 전달
                        this.event.emit('connection', socket);
                        // 클라이언트에는 성공으로 응답
                        res.status(200).json({
                            result: 'success',
                            clientId: socket.id,
                        });
                    }
                });
            }
            catch (error) {
                res.status(400).json(js_error_1.default.make(error));
            }
        });
        this.serverEvent.on('emit', ({ req, res }) => {
            try {
                // 헤더로부터 id 값을 참조
                const id = req.header('id');
                if (id == null) {
                    // id 값이 없으면 에러 응답
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else {
                    // id에 해당하는 연결 객체 가져오기
                    const socket = this.socketList.get(id);
                    if (socket != null) {
                        // 데이터 수신 이벤트 전달
                        socket.events.emit('recv', req.body);
                        // 클라이언트에는 성공으로 응답
                        res.status(200).json({ result: 'success' });
                    }
                    else {
                        // id에 해당하는 연결 객체가 없으면, 서버와 연결 끊어진 것으로 판단
                        // NOTE: 서버 재시작 또는 장시간 연결 끊기면서 서버에 클라이언트 연결 정보가 없는 상태
                        // 클라이언트는 이 에러 수신 받으면 다시 처음부터 연결 수행
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
                // 헤더로부터 id 값을 참조
                const id = req.header('id');
                if (id == null) {
                    // id 값이 없으면 에러 응답
                    js_error_1.default.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
                }
                else {
                    const socket = this.socketList.get(id);
                    if (socket != null) {
                        // Long Polling 처리
                        socket.wait({ req, res });
                    }
                    else {
                        // id에 해당하는 연결 객체가 없으면, 서버와 연결 끊어진 것으로 판단
                        // NOTE: 서버 재시작 또는 장시간 연결 끊기면서 서버에 클라이언트 연결 정보가 없는 상태
                        // 클라이언트는 이 에러 수신 받으면 다시 처음부터 연결 수행
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
            // 고유 번호 생성
            // NOTE: 생성 규칙: (A~Z, a~z, 0~9) 문자 조합,
            // 길이는 CLIENT_ID_LENGTH로 정의,
            // 임의값 시드는 밀리초 단위 시간 사용
            //
            // 만약 생성한 값이 이미 있으면 다시 시도
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
    // middleware 호출
    run(socket, fn) {
        const fns = [...this.fns];
        function run(idx) {
            fns[idx](socket, (error) => {
                if (error) {
                    // 에러 발생 시 에러로 콜백 호출
                    fn(error);
                }
                else if (fns[idx + 1] == null) {
                    // 모든 middleware 함수 호출 후 콜백 호출
                    fn();
                }
                else {
                    run(idx + 1); // 재귀 호출
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
    emit(name, data, flag) {
        var _a;
        if (this.groupList.size > 0) {
            this.groupList.forEach((groupName) => {
                const socketList = this.groups.socketList.get(groupName);
                if (socketList != null) {
                    socketList.forEach((socket) => {
                        socket.emit(name, data);
                    });
                }
            });
            if (flag == null) {
                // 다른 클러스터에도 전달 요청
                (_a = this.cluster) === null || _a === void 0 ? void 0 : _a.publish({
                    channel: 'emit',
                    data: {
                        groupList: [...this.groupList],
                        pkt: { name, data },
                    },
                });
            }
        }
    }
    to(groupName) {
        this.groupList.add(groupName);
        return this;
    }
    close() {
        this.server.close();
    }
    setCluster(opts) {
        this.cluster = new cluster_1.default(this, opts);
        this.options = {
            ...this.options,
            cluster: this.cluster,
        };
    }
}
exports.default = PollingComm;
PollingComm.CLIENT_ID_LENGTH = 8;
