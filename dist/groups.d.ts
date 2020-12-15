import Socket from './socket';
export default class Groups {
    socketList: Map<string, Set<Socket>>;
    groupList: Map<string, Set<string>>;
    join({ groupName, socket }: {
        groupName: string;
        socket: Socket;
    }): void;
    leave({ groupName, socket }: {
        groupName: string;
        socket: Socket;
    }): void;
    leaveAll({ socket }: {
        socket: Socket;
    }): void;
}
