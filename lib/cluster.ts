import { AnyId } from 'anyid';
import { RedisClient } from 'redis';
import PollingComm from './index';

interface ClusterOptions {
  host: string;
  port: number;
}

interface Request {
  channel: 'emit' | 'resp';
  id: string;
  reqNo: number;
  data: any;
}

export default class Cluster {
  private id: string = new AnyId()
    .encode('Aa0')
    .length(5)
    .time('ms')
    .id();

  private reqNo: number = 0;

  private pub: RedisClient;

  private sub: RedisClient;

  private io: PollingComm;

  constructor(io:PollingComm, options: ClusterOptions) {
    this.io = io;

    this.pub = new RedisClient(options);
    this.sub = new RedisClient(options);

    this.sub.on('subscribe', this.onSubscribe.bind(this));
    this.sub.on('message_buffer', this.onMessage.bind(this));
  }

  private onSubscribe(channel: string, count: number) {
    console.log('onSubscribe:', this.id, channel, count);
  }

  private onMessage(channel: string, msg: string) {
    const payload = JSON.parse(msg);

    switch (channel) {
      case 'emit':
        this.onEmit(payload);
        break;
      default:
        break;
    }
  }

  private onEmit(payload: {
    id: string,
    reqNo: number,
    data: any,
  }): void {
    const emitInfo = payload.data;
    this.io.to(emitInfo.groupName).emit(emitInfo.pkt.name, emitInfo.pkt.data);
  }

  private publish(req: Request) {
    const payload = {
      id: this.id,
      reqNo: this.reqNo,
      data: req.data,
    };

    this.pub.publish(req.channel, JSON.stringify(payload));
  }
}
