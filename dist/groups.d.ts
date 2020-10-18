import Socket from './socket';
export default class Groups {
    socketList: Map<string, Set<Socket>>;
    groupList: Map<string, Set<string>>;
    join({ groupName, socket }: {
        groupName: string;
        socket: any;
    }): void;
    leave({ groupName, socket }: {
        groupName: string;
        socket: any;
    }): void;
}
