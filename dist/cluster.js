"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const anyid_1 = require("anyid");
const redis_1 = require("redis");
class Cluster {
    constructor(io, options) {
        this.id = new anyid_1.AnyId()
            .encode('Aa0')
            .length(5)
            .time('ms')
            .id();
        this.reqNo = 0;
        this.reqList = new Map();
        this.io = io;
        this.pub = new redis_1.RedisClient(options);
        this.sub = new redis_1.RedisClient(options);
        this.sub.on('subscribe', this.onSubscribe.bind(this));
        this.sub.on('message', this.onMessage.bind(this));
        this.sub.subscribe('response');
        this.sub.subscribe('emit');
        this.sub.subscribe('groups');
    }
    onSubscribe(channel, count) {
        console.log('onSubscribe:', this.id, channel, count);
    }
    onMessage(channel, msg) {
        const payload = JSON.parse(msg);
        if (this.id !== payload.id) {
            switch (channel) {
                case 'response':
                    this.onResponse(payload);
                    break;
                case 'emit':
                    this.onEmit(payload);
                    break;
                default:
                    break;
            }
        }
    }
    onResponse(payload) {
        if (this.id === payload.id) {
            const request = this.reqList.get(payload.reqNo);
            if (request != null) {
                request(payload.data);
                this.reqList.delete(payload.reqNo);
            }
        }
    }
    onEmit(payload) {
        const emitInfo = payload.data;
        emitInfo.groupList.forEach((groupName) => {
            this.io.to(groupName);
        });
        this.io.emit(emitInfo.pkt.name, emitInfo.pkt.data, true);
    }
    publish(req, cb) {
        const payload = {
            id: this.id,
            reqNo: this.reqNo,
            data: req.data,
        };
        this.pub.publish(req.channel, JSON.stringify(payload));
        if (cb != null) {
            this.reqList.set(payload.reqNo, cb);
        }
        this.reqNo += 1;
    }
}
exports.default = Cluster;
