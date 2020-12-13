import * as http from 'http';
import * as express from 'express';
import * as cors from 'cors';
import { EventEmitter as Events } from 'events';

export interface ServerEventParam {
  req: express.Request;
  res: express.Response;
}

export default class Server {
  // Express 객체
  app: express.Express;

  // 웹 서버
  server: http.Server | null;

  // 웹 요청 처리자
  serverEvent: Events;

  constructor(port: number | express.Express, serverEvent: Events) {
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
    } else {
      this.app = port;
      this.server = null;
    }

    this.serverEvent = serverEvent;
  }

  private commRouter(): express.Router {
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

  public close(): void {
    this.server?.close();
  }
}
