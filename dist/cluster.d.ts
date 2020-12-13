import PollingComm from './index';
export interface ClusterOptions {
    host: string;
    port: number;
}
interface Request {
    channel: 'emit' | 'resp';
    data: any;
}
declare type RespCb = (data: any) => void;
export default class Cluster {
    private id;
    private reqNo;
    private pub;
    private sub;
    private reqList;
    private io;
    constructor(io: PollingComm, options: ClusterOptions);
    private onSubscribe;
    private onMessage;
    private onResponse;
    private onEmit;
    publish(req: Request, cb?: RespCb): void;
}
export {};
