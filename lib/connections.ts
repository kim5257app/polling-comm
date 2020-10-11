import { EventEmitter as Events } from 'events';
import { AnyId } from 'anyid';
import Connection, { GroupManage, EventManage } from './connection';
import Group from './group';

export interface ConnectionsOptions {
  cleanupInterval?: number,
}

export default class Connections implements GroupManage, EventManage {
  private static readonly CLIENT_ID_LENGTH = 8;

  options: {
    cleanupInterval: number,
  };

  events: Events = new Events();

  // 클라이언트 연결 목록
  connList: Map<string, Connection> = new Map<string, Connection>();

  // 생성된 그룹 목록
  groupList: Map<string, Group> = new Map<string, Group>();

  constructor(options: ConnectionsOptions) {
    const defaultOptions: ConnectionsOptions = {
      cleanupInterval: 10000,
    };

    // 옵션 설정
    this.options = {
      cleanupInterval: 10000,
      ...defaultOptions,
      ...options,
    };
  }

  public makeConnection(): string {
    let clientId: string;

    do {
      clientId = new AnyId()
        .encode('Aa0')
        .length(Connections.CLIENT_ID_LENGTH)
        .time('ms')
        .id();
    } while (Object.prototype.hasOwnProperty.call(this.connList, clientId));

    this.connList.set(clientId, new Connection(clientId, {
      closeTimeout: this.options.cleanupInterval * 3,
      groupManage: this,
      eventManage: this,
    }));

    this.events.emit('connected', this.connList.get(clientId));

    return clientId;
  }

  public hasConnection(clientId: string): boolean {
    return this.connList.has(clientId);
  }

  public join(groupName: string, clientId: string): void {
    let group = this.groupList.get(groupName);

    // 그룹이 없을 경우 새로 생성
    if (group == null) {
      group = new Group();
      this.groupList.set(groupName, group);
    }

    // 그룹에 연결 객체 추가
    const conn = this.connList.get(clientId);
    if (conn != null) {
      group.add(conn);
    }
  }

  public leave(groupName: string, clientId: string): void {
    const group = this.groupList.get(groupName);
    const conn = this.connList.get(clientId);

    if (group != null && conn != null) {
      group.remove(conn);

      // 더 이상 그룹에 연결 객체 없으면 그룹 제거
      if (group.length() <= 0) {
        this.groupList.delete(groupName);
      }
    }
  }

  public emit(name: string, data: any): void {
    this.events.emit(name, data);
  }
}
