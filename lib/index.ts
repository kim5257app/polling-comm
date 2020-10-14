import Debug from 'debug';
import { EventEmitter as Events } from 'events';
import { AnyId } from 'anyid';
import Error from '@kim5257/js-error';

import Server, { ServerEventParam } from './server';
import Socket from './socket';

const debug = Debug('polling-comm');

export default class PollingComm {
  private static readonly CLIENT_ID_LENGTH = 8;

  // 웹 서버
  server: Server;

  // Socket 목록
  socketList = new Map<string, Socket>();

  // 웹 요청 처리자
  serverEvent = new Events();

  // 외부 이벤트 전달자
  event = new Events();

  constructor(port: number) {
    this.initServerEvents();

    this.server = new Server(port, this.serverEvent);
  }

  private initServerEvents(): void {
    this.serverEvent.on('connect', ({ res }: ServerEventParam) => {
      try {
        // 새로운 연결 생성 및 'connection' 이벤트 전달
        const socket = this.makeSocket();

        debug('New socket:', socket.id);

        this.event.emit('connection', socket);

        res.status(200).json({
          result: 'success',
          clientId: socket.id,
        });
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    });

    this.serverEvent.on('emit', ({ req, res }: ServerEventParam) => {
    });

    this.serverEvent.on('wait', ({ req, res }: ServerEventParam) => {
      try {
        const id: string | undefined = req.header('id');

        if (id == null) {
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else if (!this.socketList.has(id)) {
          debug(`Disconnected: ${id}`);
        } else {
          this.socketList.get(id)?.wait({ req, res });
        }
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    });
  }

  private makeSocket(): Socket {
    let clientId: string;

    do {
      clientId = new AnyId()
        .encode('Aa0')
        .length(PollingComm.CLIENT_ID_LENGTH)
        .time('ms')
        .id();
    } while (this.socketList.has(clientId));

    const socket = new Socket(clientId);

    this.socketList.set(clientId, socket);

    return socket;
  }

  public on(name: 'connection', cb: (connection: any) => void): void {
    this.event.on(name, cb);
  }
}
