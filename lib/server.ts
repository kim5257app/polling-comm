import * as http from 'http';
import * as express from 'express';
import { EventEmitter as Events } from 'events';

export interface ServerEventParam {
  req: express.Request;
  res: express.Response;
}

export default class Server {
  // Express 객체
  app: express.Express;

  // 웹 서버
  server: http.Server;

  // 웹 요청 처리자
  serverEvent: Events;

  constructor(port: number, serverEvent: Events) {
    this.app = express();

    this.app.set('port', port);
    this.app.use('/comm', this.commRouter());

    this.server = http.createServer(this.app);

    this.server.listen(port);

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
}
