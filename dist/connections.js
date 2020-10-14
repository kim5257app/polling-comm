"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const anyid_1 = require("anyid");
const connection_1 = require("./connection");
const group_1 = require("./group");
class Connections {
    constructor(options) {
        this.events = new events_1.EventEmitter();
        // 클라이언트 연결 목록
        this.connList = new Map();
        // 생성된 그룹 목록
        this.groupList = new Map();
        const defaultOptions = {
            cleanupInterval: 10000,
        };
        // 옵션 설정
        this.options = Object.assign(Object.assign({ cleanupInterval: 10000 }, defaultOptions), options);
    }
    makeConnection() {
        let clientId;
        do {
            clientId = new anyid_1.AnyId()
                .encode('Aa0')
                .length(Connections.CLIENT_ID_LENGTH)
                .time('ms')
                .id();
        } while (Object.prototype.hasOwnProperty.call(this.connList, clientId));
        this.connList.set(clientId, new connection_1.default(clientId, {
            closeTimeout: this.options.cleanupInterval * 3,
            groupManage: this,
            eventManage: this,
        }));
        this.events.emit('connected', this.connList.get(clientId));
        return clientId;
    }
    hasConnection(clientId) {
        return this.connList.has(clientId);
    }
    join(groupName, clientId) {
        let group = this.groupList.get(groupName);
        // 그룹이 없을 경우 새로 생성
        if (group == null) {
            group = new group_1.default();
            this.groupList.set(groupName, group);
        }
        // 그룹에 연결 객체 추가
        const conn = this.connList.get(clientId);
        if (conn != null) {
            group.add(conn);
        }
    }
    leave(groupName, clientId) {
        const group = this.groupList.get(groupName);
        const conn = this.connList.get(clientId);
        if (group != null && conn != null) {
            group.remove(conn);
            // 더 이상 그룹에 연결 객체 없으면 그룹 제거
            if (group.length() <= 0) {
                this.groupList.delete(groupName);
            }
        }
    }
    emit(name, data) {
        this.events.emit(name, data);
    }
}
exports.default = Connections;
Connections.CLIENT_ID_LENGTH = 8;
