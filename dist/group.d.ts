import Connection from './connection';
export default class Group {
    connList: Array<Connection>;
    emit(name: string, payload: object): void;
    add(connection: Connection): void;
    remove(connection: Connection): void;
    hasConnection(connection: Connection): boolean;
    length(): number;
}
