"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const express = require("express");
const cors = require("cors");
class Server {
    constructor(port, serverEvent) {
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
    commRouter() {
        const router = express.Router();
        router.get('/connect', ((req, res) => {
            this.serverEvent.emit('connect', { req, res });
        }));
        router.post('/emit', ((req, res) => {
            this.serverEvent.emit('emit', { req, res });
        }));
        router.get('/wait', ((req, res) => {
            this.serverEvent.emit('wait', { req, res });
        }));
        return router;
    }
    close() {
        this.server.close();
    }
}
exports.default = Server;
