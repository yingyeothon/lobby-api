import mem from "mem";
import redisConnect from "../redis/connect";

export default mem(redisConnect);
