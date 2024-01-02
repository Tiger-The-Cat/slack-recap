import { bot } from "..";
import type { Channel } from "@slack/web-api/dist/response/ChannelsListResponse";

const allChannels: Channel[] = [];
export default allChannels;

export const getChannels = async (cursor?: string) => {
  const channels = await bot.client.conversations.list({
    types: "public_channel",
    exclude_archived: true,
    cursor,
  });
  if (!channels.channels) return;
  allChannels.push(...channels.channels);
  if (!channels.response_metadata?.next_cursor) {
    console.log(`finished getting ${allChannels.length} channels`);
    return;
  }
  getChannels(channels.response_metadata.next_cursor);
};
