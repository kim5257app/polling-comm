import Debug from 'debug';
import * as http from 'http';
import * as express from 'express';
import Error from '@kim5257/js-error';
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

    this.server.listen(port);
  }

  private commRouter(): express.Router {
    const router = express.Router();

    router.get('/connect', ((req, res) => {
      try {
        const clientId: string = this.connections.makeConnection();

        debug('New connection:', clientId);

        res.status(200).json({
          result: 'success',
          clientId,
        });
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    }));

    router.post('/emit', ((req, res) => {
      try {
        const clientId: string | undefined = req.header('id');

        if (clientId == null) {
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else if (!this.connections.hasConnection(clientId)) {
          Error.throwFail('ERR_GONE', 'No connection this clientID', 400);
        } else {
          const payload = req.body;

          const connection = this.connections.connList.get(clientId);
          connection?.recv('recv', payload);
        }
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    }));

    router.get('/wait', ((req, res) => {
      try {
        const clientId: string | undefined = req.header('id');

        if (clientId == null) {
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else if (!this.connections.hasConnection(clientId)) {
          Error.throwFail('ERR_GONE', 'No connection this clientID', 400);
        } else {
          const connection = this.connections.connList.get(clientId);
          connection?.wait(req, res);
        }
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    }));

    return router;
  }
}
