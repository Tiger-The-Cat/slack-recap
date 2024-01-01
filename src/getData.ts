import { RespondFn } from "@slack/bolt";
import { bot } from ".";
import { writeFileSync } from "fs";
import path from "path";

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
    //Actual data collection down here 👇

    const user = await bot.client.users.info({ user: id });

    data = { id, name: user.user?.name ?? "Somebody" };
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
