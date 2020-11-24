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
        // 새로운 연결 생성
        const socket = this.makeSocket();

        debug('New socket:', socket.id);

        // NOTE: run 함수를 호출하여 use 함수로 등록한 middleware 함수를 호출
        // 모든 middleware 함수 호출 후 에러 없으면, 연결 완료
        // 자세한 부분은 run 함수 참조
        this.run(socket, (error) => {
          if (error) {
            Error.throwError(error);
          } else {
            // 'connection' 이벤트 전달
            this.event.emit('connection', socket);

            // 클라이언트에는 성공으로 응답
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
        // 헤더로부터 id 값을 참조
        const id: string | undefined = req.header('id');

        if (id == null) {
          // id 값이 없으면 에러 응답
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else {
          // id에 해당하는 연결 객체 가져오기
          const socket = this.socketList.get(id);
          if (socket != null) {
            // 데이터 수신 이벤트 전달
            socket.events.emit('recv', req.body);

            // 클라이언트에는 성공으로 응답
            res.status(200).json({ result: 'success' });
          } else {
            // id에 해당하는 연결 객체가 없으면, 서버와 연결 끊어진 것으로 판단
            // NOTE: 서버 재시작 또는 장시간 연결 끊기면서 서버에 클라이언트 연결 정보가 없는 상태
            // 클라이언트는 이 에러 수신 받으면 다시 처음부터 연결 수행
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
        // 헤더로부터 id 값을 참조
        const id: string | undefined = req.header('id');

        if (id == null) {
          // id 값이 없으면 에러 응답
          Error.throwFail('ERR_BAD_REQUEST', 'Wrong Header', 400);
        } else {
          const socket = this.socketList.get(id);
          if (socket != null) {
            // Long Polling 처리
            socket.wait({ req, res });
          } else {
            // id에 해당하는 연결 객체가 없으면, 서버와 연결 끊어진 것으로 판단
            // NOTE: 서버 재시작 또는 장시간 연결 끊기면서 서버에 클라이언트 연결 정보가 없는 상태
            // 클라이언트는 이 에러 수신 받으면 다시 처음부터 연결 수행
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
      // 고유 번호 생성
      // NOTE: 생성 규칙: (A~Z, a~z, 0~9) 문자 조합,
      // 길이는 CLIENT_ID_LENGTH로 정의,
      // 임의값 시드는 밀리초 단위 시간 사용
      //
      // 만약 생성한 값이 이미 있으면 다시 시도
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

  // middleware 호출
  private run(socket: Socket, fn: (error?: Error) => void) {
    const fns = [...this.fns];

    function run(idx: number) {
      fns[idx](socket, (error?: Error) => {
        if (error) {
          // 에러 발생 시 에러로 콜백 호출
          fn(error);
        } else if (fns[idx + 1] == null) {
          // 모든 middleware 함수 호출 후 콜백 호출
          fn();
        } else {
          run(idx + 1); // 재귀 호출
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
