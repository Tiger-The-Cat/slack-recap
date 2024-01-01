import { RespondFn } from "@slack/bolt";
import type { Match } from "@slack/web-api/dist/response/SearchMessagesResponse";
import { bot } from ".";
import { writeFileSync } from "fs";
import path from "path";
import { RecapData } from "./data";
import env from "./utils/env";
import wordsToOmit from "./utils/wordsToOmmit";

const gettingData = new Map<string, boolean>();

const getData = async (id: string, respond: RespondFn) => {
  try {
    let data: RecapData | null = null;
    try {
      data = require(`../data/${id}.json`);
    } catch {}
    if (data) return data;
    if (gettingData.get(id)) {
      await respond({
        text: "I'm still getting your data! This stuff isn't instant, y'know? Or maybe I errored out last time and I'm stuck, and in that case sorry.",
      });
      return null;
    }

    await respond({
      text: "I'm gonna have to collect some data for you first! Give me a minute...",
    });
    gettingData.set(id, true);

    data = await collectData(id);

    writeFileSync(
      path.join(__dirname, `../data/${id}.json`),
      JSON.stringify(data)
    );
    gettingData.set(id, false);
    return data;
  } catch (e) {
    console.log(e);
    gettingData.set(id, false);
    respond({ text: "Whoops, an error!\n" + e });
    return null;
  }
};
export default getData;

export const collectData = async (id: string) => {
  let data: RecapData | null = null;

  const user = await bot.client.users.info({ user: id });
  if (!user.user) throw new Error("User not found!");

  const allMessages: Match[] = [];
  const messagesPage1 = await bot.client.search.messages({
    query: `from:<@${id}>`,
    sort: "timestamp",
    sort_dir: "desc",
    count: 100,
    token: env.SLACK_USER_TOKEN,
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
  // sort words
  const mostUsedWords = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  mostUsedWords.length = Math.min(mostUsedWords.length, 20);

  data = {
    id,
    profile: user.user,
    messagesSent: allMessages.length,
    mostUsedWords,
  };
  return data;
};
