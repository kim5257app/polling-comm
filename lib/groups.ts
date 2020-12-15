// eslint-disable-next-line import/no-cycle
import Socket from './socket';

type GroupName = string;
type SocketId = string;

export default class Groups {
  // 그룹 이름을 key로 가지는 Socket 집합 목록
  socketList = new Map<GroupName, Set<Socket>>();

  // Socket ID를 key로 가지는 Group 집합 목록
  groupList = new Map<SocketId, Set<string>>();

  public join({ groupName, socket }: { groupName: string, socket: Socket }): void {
    // Socket 집합 목록에 추가
    if (!this.socketList.has(groupName)) {
      this.socketList.set(groupName, new Set<any>([socket]));
    } else {
      this.socketList.get(groupName)?.add(socket);
    }

    // Group 집합 목록에 추가
    if (!this.groupList.has(socket.id)) {
      this.groupList.set(socket.id, new Set<string>([groupName]));
    } else {
      this.groupList.get(socket.id)?.add(groupName);
    }
  }

  public leave({ groupName, socket }: { groupName: string, socket: Socket }): void {
    // Socket 집합 목록에서 제거
    const socketSet = this.socketList.get(groupName);
    if (socketSet != null) {
      socketSet.delete(socket);

      // 더 이상 Socket이 없을 경우에는 목록에서 제거
      if (socketSet.size <= 0) {
        this.socketList.delete(groupName);
      }
    }

    // Group 집합 목록에서 제거
    const groupSet = this.groupList.get(socket.id);
    if (groupSet != null) {
      groupSet.delete(groupName);

      if (groupSet.size <= 0) {
        this.groupList.delete(socket.id);
      }
    }
  }

  public leaveAll({ socket }: { socket: Socket }): void {
    // 그룹 목록 가져오기
    const groupSet = this.groupList.get(socket.id);
    if (groupSet != null) {
      groupSet.forEach((groupName) => {
        const group = this.socketList.get(groupName);
        group?.delete(socket);
      });

      this.groupList.delete(socket.id);
    }
  }
}
