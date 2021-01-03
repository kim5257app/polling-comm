import { AnyId } from 'anyid';
import { RedisClient } from 'redis';
import { EventEmitter } from 'events';

// eslint-disable-next-line import/no-cycle
import PollingComm from './index';

export interface ClusterOptions {
  host: string;
  port: number;
}

interface Request {
  channel: 'emit' | 'resp';
  data: any;
}

type RespCb = (data: any) => void;

export default class Cluster {
  private id: string = new AnyId()
    .encode('Aa0')
    .length(5)
    .time('ms')
    .id();

  private reqNo: number = 0;

  private pub: RedisClient;

  private sub: RedisClient;

  private reqList = new Map<number, RespCb>();

  private io: PollingComm;

  private events: EventEmitter = new EventEmitter();

  constructor(io:PollingComm, options: ClusterOptions) {
    this.io = io;

    this.pub = new RedisClient(options);
    this.sub = new RedisClient(options);

    this.sub.on('subscribe', this.onSubscribe.bind(this));
    this.sub.on('message', this.onMessage.bind(this));

    this.sub.subscribe('response');

    this.sub.subscribe('emit');
    this.sub.subscribe('groups');
    this.sub.subscribe('notify');
  }

  private onSubscribe(channel: string, count: number) {
    console.log('onSubscribe:', this.id, channel, count);
  }

  private onMessage(channel: string, msg: string) {
    const payload = JSON.parse(msg);

    if (this.id !== payload.id) {
      switch (channel) {
        case 'response':
          this.onResponse(payload);
          break;
        case 'emit':
          this.onEmit(payload);
          break;
        case 'notify':
          this.onNotify(payload);
          break;
        default:
          break;
      }
    }
  }

  private onResponse(payload: {
    id: string,
    reqNo: number,
    data: any,
  }): void {
    if (this.id === payload.id) {
      const request = this.reqList.get(payload.reqNo);

      if (request != null) {
        request(payload.data);
        this.reqList.delete(payload.reqNo);
      }
    }
  }

  private onEmit(payload: {
    id: string,
    reqNo: number,
    data: any,
  }): void {
    const emitInfo: {
      groupList: Set<string>,
      pkt: {
        name: string,
        data: object,
      }
    } = payload.data;

    emitInfo.groupList.forEach((groupName) => {
      this.io.to(groupName);
    });
    this.io.emit(emitInfo.pkt.name, emitInfo.pkt.data, true);
  }

  private onNotify(payload: {
    name: string,
    data: any,
  }): void {
    this.events.emit(payload.name, payload.data);
  }

  public addOnNotify(name: string, cb: (data: any) => void): void {
    this.events.on(name, cb);
  }

  public notify(name: string, data: any): void {
    this.pub.publish('notify', JSON.stringify({
      name,
      data,
    }));
  }

  public publish(req: Request, cb?: RespCb) {
    const payload = {
      id: this.id,
      reqNo: this.reqNo,
      data: req.data,
    };

    this.pub.publish(req.channel, JSON.stringify(payload));

    if (cb != null) {
      this.reqList.set(payload.reqNo, cb);
    }

    this.reqNo += 1;
  }
}
