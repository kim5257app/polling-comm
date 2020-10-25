import Debug from 'debug';
import { EventEmitter as Events } from 'events';
import { AnyId } from 'anyid';
import Error from '@kim5257/js-error';

import Server, { ServerEventParam } from './server';
import Socket, { Options as SocketOpts } from './socket';
import Groups from './groups';

const debug = Debug('polling-comm');

interface Options extends SocketOpts {
  port: number;
}

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

  // Socket 적용 옵션
  options: Options;

  // 그룹 관리 객체
  groups: Groups = new Groups();

  private fns: ((socket: Socket, next: (error?: any) => void) => void)[] = [];

  constructor(options: Options) {
    this.options = {
      ...options,
      groups: this.groups,
    };

    this.initServerEvents();

    this.server = new Server(options.port, this.serverEvent);
  }

  private initServerEvents(): void {
    this.serverEvent.on('connect', ({ res }: ServerEventParam) => {
      try {
        // 새로운 연결 생성 및 'connection' 이벤트 전달
        const socket = this.makeSocket();

        debug('New socket:', socket.id);

        this.run(socket, (error) => {
          if (error) {
            Error.throwError(error);
          } else {
            this.event.emit('connection', socket);

            res.status(200).json({
              result: 'success',
              clientId: socket.id,
            });
          }
        });
      } catch (error) {
        res.status(400).json(Error.make(error));
      }
    });

    this.serverEvent.on('emit', ({ req, res }: ServerEventParam) => {
      try {
        const id: string | undefined = req.header('id');

        if (id == null) {
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else {
          const socket = this.socketList.get(id);
          if (socket != null) {
            // 데이터 수신 이벤트 발생
            socket.events.emit('recv', req.body);
            res.status(200).json({ result: 'success' });
          } else {
            debug(`Disconnected: ${id}`);
            Error.throwFail('ERR_GONE', 'This id isn\'t available', 410);
          }
        }
      } catch (error) {
        const code = (error.code != null && error.code > 200) ? error.code : 500;
        res.status(code).json(Error.make(error));
      }
    });

    this.serverEvent.on('wait', ({ req, res }: ServerEventParam) => {
      try {
        const id: string | undefined = req.header('id');

        if (id == null) {
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else {
          const socket = this.socketList.get(id);
          if (socket != null) {
            socket.wait({ req, res });
          } else {
            debug(`Disconnected: ${id}`);
            Error.throwFail('ERR_GONE', 'This id isn\'t available', 410);
          }
        }
      } catch (error) {
        const code = (error.code != null && error.code > 200) ? error.code : 500;
        res.status(code).json(Error.make(error));
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

    const socket = new Socket(clientId, this.options);

    this.socketList.set(clientId, socket);

    return socket;
  }

  private run(socket: Socket, fn: (error?: Error) => void) {
    const fns = [...this.fns];

    function run(idx: number) {
      fns[idx](socket, (error?: Error) => {
        if (error) {
          fn(error);
        } else if (fns[idx + 1] == null) {
          fn();
        } else {
          run(idx + 1);
        }
      });
    }

    if (fns.length <= 0) {
      fn();
    } else {
      run(0);
    }
  }

  public on(name: 'connection', cb: (connection: any) => void): void {
    this.event.on(name, cb);
  }

  public use(fn: (socket: Socket, next: (error?: any) => void) => void): void {
    this.fns.push(fn);
  }

  public close(): void {
    this.server.close();
  }
}
