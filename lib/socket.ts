import Debug from 'debug';
import { Response } from 'express';
import { EventEmitter as Events } from 'events';
import { ServerEventParam } from './server';

// eslint-disable-next-line import/no-cycle
import Groups from './groups';

const debug = Debug('polling-comm/socket');

export interface Packet {
  name: string;
  data: string;
}

export interface Options {
  groups: Groups;
  waitInterval?: number;
}

export default class Socket {
  public readonly id: string;

  // 그룹 관리 객체
  private groups: Groups;

  // wait 요청에 대한 응답 객체
  private waitRes: Response | null = null;

  // emit 해야 할 데이터 목록
  private emitList: (Packet)[] = [];

  // emit 해야 할 그룹 목록
  private groupList = new Set<Set<Socket>>();

  // 수신된 데이터에 대한 이벤트
  public events = new Events();

  // use 함수로 등록된 middleware
  private fns: ((packet: Packet, next:(error?: Error) => void) => void)[] = [];

  // wait 주기
  private readonly waitInterval: number;

  // timeout 기준
  private readonly timeoutBase: number;

  // 연결 타임아웃 (wait가 일정시간 없으면 연결 종료)
  private timeout: number;

  constructor(id: string, options: Options) {
    this.id = id;

    this.groups = options.groups;

    this.waitInterval = (options.waitInterval) ? (options.waitInterval) : (10 * 1000);
    this.timeoutBase = this.waitInterval * 3;

    this.timeout = new Date().getTime() + this.timeoutBase;

    this.events.on('disconnected', () => {
      // TODO: 연결 해제된 경우 처리
    });

    this.events.on('recv', (packet: Packet) => {
      // 수신 처리
      this.run(packet, (error) => {
        if (error) {
          this.emit('error', error);
        } else {
          this.events.emit(packet.name, packet.data);
        }
      });
    });
  }

  private run(packet: Packet, fn: (error?: Error) => void) {
    const fns = [...this.fns];

    function run(idx: number) {
      fns[idx](packet, (error?: Error) => {
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

  public wait({ req, res }: ServerEventParam): void {
    this.waitRes = res;

    req.on('close', () => {
      debug('closed by client');
      this.waitRes = null;
    });

    this.resetTimeout();

    // wait 응답 처리
    this.doProgress();
  }

  public on(name: string, cb: (data: object) => void) {
    this.events.on(name, cb);
  }

  public use(fn: (packet: Packet, next:(error?: Error) => void) => void): void {
    this.fns.push(fn);
  }

  public emit(name: string, data: object) {
    const packet = {
      name,
      data: JSON.stringify(data),
    };

    if (this.groupList.size > 0) {
      this.groupList.forEach((group) => {
        group.forEach((socket) => {
          if (socket.id !== this.id) {
            socket.emitList.push(packet);
            socket.doProgress();
          }
        });
      });
    } else {
      this.emitList.push(packet);
      this.doProgress();
    }
  }

  public to(group: string): Socket {
    const socketList = this.groups.socketList.get(group);

    if (socketList != null) {
      this.groupList.add(socketList);
    }

    return this;
  }

  public join(groupName: string): Socket {
    this.groups.join({ groupName, socket: this });
    return this;
  }

  public leave(groupName: string): Socket {
    this.groups.leave({ groupName, socket: this });
    return this;
  }

  // wait 요청이 오면 emit 으로 수신된 데이터로 응답
  // emit 요청이 오면 wait 요청이 있을 경우 데이터로 응답
  private doProgress(): void {
    // wait 요청이 있으면서 emitList 안에 데이터가 있으면 처리
    if (this.waitRes != null && this.emitList.length > 0) {
      this.waitRes.status(200).json(this.emitList[0]);
      this.waitRes = null;
      this.emitList.splice(0, 1);
    }
  }

  private resetTimeout(): void {
    this.timeout = new Date().getTime() + this.timeoutBase;
  }
}
