import type { User } from "@slack/bolt";

declare type RecapData = {
  id: string;
  profile: User;
  messagesSent: number;
  mostUsedWords: [string, number][];
};
