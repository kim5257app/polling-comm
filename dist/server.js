"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
const cors = require("cors");
class Server {
    constructor(port, serverEvent) {
        if (typeof port === 'number') {
            this.app = express();
            this.app.set('port', port);
            // CORS 허용
            this.app.use(cors());
            // JSON parser 사용
            // Body 크기 제한은 100MB로 제한
            this.app.use(express.json({ limit: '100mb' }));
            // '/comm' 경로 이후 루틴은 commRouter에서 설정
            this.app.use('/comm', this.commRouter());
            // 웹 서버 생성
            this.server = http.createServer(this.app);
            this.server.listen(port);
            this.serverEvent = serverEvent;
        }
        else {
            this.app = port;
            this.app.use(cors());
            // JSON parser 사용
            // Body 크기 제한은 100MB로 제한
            this.app.use(express.json({ limit: '100mb' }));
            // '/comm' 경로 이후 루틴은 commRouter에서 설정
            this.app.use('/comm', this.commRouter());
            this.server = null;
        }
        this.serverEvent = serverEvent;
    }
    commRouter() {
        const router = express.Router();
        router.get('/connect', ((req, res) => {
            this.serverEvent.emit('connect', { req, res });
        }));
        router.post('/emit', ((req, res) => {
            this.serverEvent.emit('emit', { req, res });
        }));
        router.get('/wait', ((req, res) => {
            const timeout = (req.headers['comm-hash'] != null) ? (39) : (8);
            req.setTimeout(timeout * 1000, () => {
                res.status(204).end();
                req.emit('close');
            });
            this.serverEvent.emit('wait', { req, res });
        }));
        return router;
    }
    close() {
        var _a;
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
    }
}
exports.default = Server;
