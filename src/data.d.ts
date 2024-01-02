import type { User } from "@slack/bolt";
import type { Channel } from "@slack/web-api/dist/response/ChannelsListResponse";

declare type RecapData = {
  id: string;
  profile: User;
  messagesSent: number;
  mostUsedWords: [string, number][];
  createdChannels: Channel[];
};
