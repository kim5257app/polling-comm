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
        this.io = io;
        this.pub = new redis_1.RedisClient(options);
        this.sub = new redis_1.RedisClient(options);
        this.sub.on('subscribe', this.onSubscribe.bind(this));
        this.sub.on('message_buffer', this.onMessage.bind(this));
    }
    onSubscribe(channel, count) {
        console.log('onSubscribe:', this.id, channel, count);
    }
    onMessage(channel, msg) {
        const payload = JSON.parse(msg);
        switch (channel) {
            case 'emit':
                this.onEmit(payload);
                break;
            default:
                break;
        }
    }
    onEmit(payload) {
        const emitInfo = payload.data;
        emitInfo.groupList.forEach((groupName) => {
            this.io.to(groupName);
        });
        this.io.emit(emitInfo.pkt.name, emitInfo.pkt.data);
    }
    publish(req) {
        const payload = {
            id: this.id,
            reqNo: this.reqNo,
            data: req.data,
        };
        this.pub.publish(req.channel, JSON.stringify(payload));
    }
}
exports.default = Cluster;
