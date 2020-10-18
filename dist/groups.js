"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Groups {
    constructor() {
        // 그룹 이름을 key로 가지는 Socket 집합 목록
        this.socketList = new Map();
        // Socket ID를 key로 가지는 Group 집합 목록
        this.groupList = new Map();
    }
    join({ groupName, socket }) {
        var _a, _b;
        // Socket 집합 목록에 추가
        if (!this.socketList.has(groupName)) {
            this.socketList.set(groupName, new Set([socket]));
        }
        else {
            (_a = this.socketList.get(groupName)) === null || _a === void 0 ? void 0 : _a.add(socket);
        }
        // Group 집합 목록에 추가
        if (!this.groupList.has(socket.id)) {
            this.groupList.set(socket.id, new Set([groupName]));
        }
        else {
            (_b = this.groupList.get(socket.id)) === null || _b === void 0 ? void 0 : _b.add(groupName);
        }
    }
    leave({ groupName, socket }) {
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
}
exports.default = Groups;
