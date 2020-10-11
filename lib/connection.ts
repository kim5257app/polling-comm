import Debug from 'debug';
import { EventEmitter as Events } from 'events';
import Connections from './connections';

const debug = Debug('polling-comm/connection');

export type EventCallback = (eventName: string, payload: object) => void;

export default class Connection {
  // Connection ID
  private readonly id: string;

  // Connection Manage Object
  private readonly comm: Connections;

  // 이벤트 목록
  private readonly events: Events = new Events();

  // 그룹 목록
  private readonly groupList: Array<string> = [];

  // 전송 데이터 큐
  private readonly emitList: Array<{eventName: string, payload: object}> = [];

  // wait 요청 결과

  constructor(id: string, comm: Connections) {
    this.id = id;
    this.comm = comm;
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

  }

  public leave(groupName: string) {

  }

  private doProgress(): void {

  }
}
