import * as redis from "redis";

class GekkoRedisBeacon {
    private client: redis.RedisClient;

    init() {
        this.client = redis.createClient(6379, "redis");

        this.client.on("subscribe", function (channel, count) {
            console.log("sub channel " + channel);
        });

        this.client.on("message", function (channel, message) {
            console.log("sub message " + channel + ": " + message);
        });
        this.client.subscribe("gekko_candle");
        this.client.subscribe("gekko_advice");
        this.client.subscribe("gekko_trade");
    }
}

export const gekkoRedisBeacon = new GekkoRedisBeacon();