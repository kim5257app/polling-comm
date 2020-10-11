import Debug from 'debug';
import { Request, Response } from 'express';
import { EventEmitter as Events } from 'events';

const debug = Debug('polling-comm/connection');

// eslint-disable-next-line no-unused-vars
export type EventCallback = (eventName: string, payload: object) => void;

interface WaitRequest {
  req: Request | null,
  res: Response | null,
}

export interface GroupManage {
  // eslint-disable-next-line no-unused-vars
  join: (groupName: string, clientId: string) => void,
  // eslint-disable-next-line no-unused-vars
  leave: (groupName: string, clientId: string) => void,
}

export interface EventManage {
  // eslint-disable-next-line no-unused-vars
  emit: (name: string, data: any) => void,
}

export interface ConnectOptions {
  closeTimeout?: number,
  groupManage: GroupManage,
  eventManage: EventManage,
}

export default class Connection {
  // 설정
  private readonly options: {
    closeTimeout: number,
    groupManage: GroupManage,
  };

  // Connection ID
  public readonly id: string;

  // 이벤트 목록
  private readonly events: Events = new Events();

  // 전송 데이터 큐
  private readonly emitList: Array<{eventName: string, payload: object}> = [];

  // wait 요청 결과
  private waitRequest: WaitRequest = { req: null, res: null };

  // 연결 유지 시간
  private timeout: number;

  // 가입된 그룹 목록
  private readonly groupList: Array<string> = [];

  // Connections 그룹 관리
  private groupManage?: GroupManage;

  // Connections 이벤트
  private eventManage?: EventManage;

  // 미들웨어 함수 목록
  private fns: Array<(payload: object, fn: (error?: any) => void) => void> = [];

  constructor(id: string, options: ConnectOptions) {
    this.id = id;
    this.options = {
      closeTimeout: 30000,
      ...options,
    };

    this.timeout = new Date().getTime() + this.options.closeTimeout;

    // 기본 이벤트 등록
    this.events.on('disconnected', () => {
      this.eventManage?.emit('cleanup', this.id);
    });

    this.events.on('recv', (payload) => {
      this.run(payload, (error) => {
        if (error) {
          this.emit('error', error);
        } else {
          this.events.emit(payload.name, payload.data);
        }
      });
    });
  }

  private run(payload: object, fn: (error?: any) => void) {
    const fns = [...this.fns];

    if (fns.length <= 0) {
      fn(null);
    }

    function run(idx: number) {
      fns[idx](payload, (error) => {
        if (error) {
          fn(error);
        } else if (fns[idx + 1] == null) {
          fn(null);
        }

        run(idx + 1);
      });
    }

    run(0);
  }

  public recv(eventName: string, payload: object): void {
    this.events.emit(eventName, payload);
  }

  public wait(req: Request, res: Response): void {
    this.waitRequest.req = req;
    this.waitRequest.res = res;

    req.on('close', () => {
      debug('Close wait request');
      this.waitRequest.res = null;
    });

    this.resetTimeout();
    this.doProgress();
  }

  public emit(eventName: string, payload: object): void {
    debug(`[${this.id}][${eventName}]: ${JSON.stringify(payload)}`);

    this.emitList.push({ eventName, payload });
    this.doProgress();
  }

  public on(eventName: string, cb: EventCallback): void {
    debug(`[${this.id}] listen on ${eventName}`);

    cb(eventName, {});
  }

  public join(groupName: string) {
    this.groupManage?.join(groupName, this.id);
    this.groupList.push(groupName);
  }

  public leave(groupName: string) {
    this.groupManage?.leave(groupName, this.id);

    const idx = this.groupList.findIndex((item) => (groupName === item));
    if (idx >= 0) {
      this.groupList.splice(idx, 1);
    }
  }

  private doProgress(): void {
    // 클라이언트로부터 wait 요청 수신 및 응답 대기 중이면서,
    // 클라이언트에 보내야 할 데이터가 있을 경우 처리
    if (this.waitRequest.res != null && this.emitList.length > 0) {
      const { res } = this.waitRequest;
      const payload = this.emitList[0];

      res.status(200).json(payload);

      this.waitRequest.res = null;
      this.emitList.splice(0, 1);
    }
  }

  private resetTimeout() {
    this.timeout = new Date().getTime() + this.options.closeTimeout;
  }
}
