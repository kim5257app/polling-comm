import Debug from 'debug';
import * as http from 'http';
import * as express from 'express';
import Connections from './connections';

const debug = Debug('polling-comm/server');

export default class Server {
  // Express 객체
  app: express.Express;

  // 웹 서버
  server: http.Server;

  // 연결 관리 객체
  connections: Connections;

  constructor(port: number, connections: Connections) {
    this.app = express();

    this.app.set('port', port);
    this.app.use('/comm', this.commRouter());

    this.server = http.createServer(this.app);

    this.connections = connections;
  }

  private commRouter(): express.Router {
    const router = express.Router();

    router.get('/connect', ((req, res) => {
      try {
        const clientId: string = this.connections.makeClientId();

        debug('New connection:', clientId);

        res.status(200).json({
          result: 'success',
          clientId,
        });
      } catch (error) {
        res.status(400).json(error);
      }
    }));

    router.post('/emit', ((req, res) => {
      try {
      } catch (error) {
        res.status(400).json(error);
      }
    }));

    router.get('/wait', ((req, res) => {

    }));

    return router;
  }
}
