import { Request, Response } from 'express';
export declare type EventCallback = (eventName: string, payload: object) => void;
interface GroupManage {
    join: (groupName: string, clientId: string) => void;
    leave: (groupName: string, clientId: string) => void;
}
export interface EventManage {
    emit: (name: string, data: any) => void;
}
export interface ConnectOptions {
    closeTimeout?: number;
    groupManage: GroupManage;
    eventManage: EventManage;
}
export default class Connection {
    private readonly options;
    readonly id: string;
    private readonly events;
    private readonly emitList;
    private waitRequest;
    private timeout;
    private readonly groupList;
    private groupManage?;
    private eventManage?;
    private fns;
    constructor(id: string, options: ConnectOptions);
    private run;
    recv(eventName: string, payload: object): void;
    wait(req: Request, res: Response): void;
    emit(eventName: string, payload: object): void;
    on(eventName: string, cb: EventCallback): void;
    join(groupName: string): void;
    leave(groupName: string): void;
    private doProgress;
    private resetTimeout;
}
export {};
