import type { Match } from "@slack/web-api/dist/response/SearchMessagesResponse";
import { bot } from ".";
import { writeFileSync } from "fs";
import path from "path";
import { RecapData } from "./data";
import env from "./utils/env";
import wordsToOmit from "./utils/wordsToOmit";
import allChannels from "./utils/allChannels";

const getData = async (id: string, noCache = false) => {
  try {
    let data: RecapData | null = null;
    try {
      data = require(`../data/${id}.json`);
    } catch {}
    if (data && !noCache) return data;

    data = await collectData(id);

    writeFileSync(
      path.join(__dirname, `../data/${id}.json`),
      JSON.stringify(data)
    );
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export default getData;

export const collectData = async (
  id: string,
  userToken = env.SLACK_USER_TOKEN // somehow, let's let people use their own token and get private data! plus bypass rate limits
) => {
  let data: RecapData | null = null;

  const user = await bot.client.users.info({ user: id });
  if (!user.user) throw new Error("User not found!");

  const allMessages: Match[] = [];
  const messagesPage1 = await bot.client.search.messages({
    query: `from:<@${id}>`,
    sort: "timestamp",
    sort_dir: "desc",
    count: 100,
    token: userToken,
  });
  if (!messagesPage1.messages?.matches) throw new Error("No messages found!");
  // loop through all pages, until reaching the last page or messages before 2023
  // add messages in 2023 to allMessages
  for (
    let i = 0;
    i < (messagesPage1.messages.pagination?.page_count ?? 1);
    i++
  ) {
    const messages = await bot.client.search.messages({
      query: `from:<@${id}>`,
      sort: "timestamp",
      sort_dir: "desc",
      count: 100,
      token: env.SLACK_USER_TOKEN,
      page: i,
    });
    for (const match of messages.messages?.matches || []) {
      if (!match.ts) {
        //idk how this would happen but thats how its typed :shrug:
        console.log(match);
        continue;
      }
      const ts = match.ts.split(".")[0];
      if (ts < "1704085200" && ts > "1672549200") {
        allMessages.push(match);
      }
      if (ts < "1672549200") break;
    }
  }

  const wordCounts = new Map<string, number>();
  for (const message of allMessages) {
    if (!message.text) continue;
    const words = message.text.toLowerCase().match(/\b\w+\b/g) || [];
    for (const word of words) {
      if (wordsToOmit.includes(word) || word.length < 2) continue;
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  const mostUsedWords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  mostUsedWords.length = Math.min(mostUsedWords.length, 15);

  const messagesInChannels = new Map<string, number>();
  for (const message of allMessages) {
    if (!message.channel) continue;
    messagesInChannels.set(
      message.channel.id!,
      (messagesInChannels.get(message.channel.id ?? message.channel.id!) || 0) +
        1
    );
  }
  // get channel names from allChannels, if available, then sort by most messages
  const mostUsedChannels = [...messagesInChannels.entries()]
    .map((c) => {
      const channel = allChannels.find((ch) => ch.id == c[0]);
      return [channel?.name || c[0], c[1]] as [string, number];
    })
    .sort((a, b) => b[1] - a[1]);
  mostUsedChannels.length = Math.min(mostUsedChannels.length, 15);

  const createdChannels = allChannels.filter((c) => {
    return (
      c.creator == id && c.created! > 1672549200 && c.created! < 1704085200
    );
  });

  data = {
    id,
    profile: user.user,
    messagesSent: allMessages.length,
    mostUsedWords,
    mostUsedChannels,
    createdChannels,
  };
  return data;
};
