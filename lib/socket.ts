import Debug from 'debug';
import { Response } from 'express';
import { ServerEventParam } from './server';

const debug = Debug('polling-comm/socket');

export interface Packet {
  name: string;
  data: string;
}

export default class Socket {
  public readonly id: string;

  // wait 요청에 대한 응답 객체
  private waitRes: Response | null = null;

  // emit 해야 할 데이터 목록
  private emitList: Array<Packet> = [];

  constructor(id: string) {
    this.id = id;
  }

  public wait({ req, res }: ServerEventParam): void {
    this.waitRes = res;

    req.on('close', () => {
      debug('closed by client');
      this.waitRes = null;
    });

    // TODO: 타임아웃 리셋

    // wait 응답 처리
    this.doProgress();
  }

  public emit(name: string, data: string) {
    this.emitList.push({ name, data });
    this.doProgress();
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
}
