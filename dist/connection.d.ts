import Connections from './connections';
export declare type EventCallback = (eventName: string, payload: object) => void;
export default class Connection {
    private readonly id;
    private readonly comm;
    private readonly events;
    private readonly groupList;
    private readonly emitList;
    constructor(id: string, comm: Connections);
    emit(eventName: string, payload: object): void;
    on(eventName: string, cb: EventCallback): void;
    join(groupName: string): void;
    leave(groupName: string): void;
    private doProgress;
}
