import PollingComm from './index';
export interface ClusterOptions {
    host: string;
    port: number;
}
interface Request {
    channel: 'emit' | 'resp';
    data: any;
}
export default class Cluster {
    private id;
    private reqNo;
    private pub;
    private sub;
    private io;
    constructor(io: PollingComm, options: ClusterOptions);
    private onSubscribe;
    private onMessage;
    private onEmit;
    publish(req: Request): void;
}
export {};
