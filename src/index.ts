console.log("starting!");
import { App } from "@slack/bolt";
import env from "./utils/env";
import getData, { collectData } from "./getData";
import { RecapData } from "./data";
import { writeFileSync } from "fs";
import path from "path";

export const bot = new App({
  token: env.SLACK_TOKEN,
  signingSecret: env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      path: "/",
      method: ["GET"],
      handler: (req, res) => {
        res.writeHead(200);
        res.end(`Things are going just fine at ${req.headers.host}!`);
      },
    },
    {
      path: "/api/data/:id",
      method: ["GET"],
      async handler(req, res) {
        const id = req.params!.id;
        let data: RecapData | null = null;
        try {
          if (!req.url?.endsWith("?noCache")) {
            //somehow the only way to get this? :(
            try {
              data = require(`../data/${id}.json`);
            } catch {}
            if (data) {
              res.writeHead(200);
              res.end(JSON.stringify(data));
              return;
            }
          }
          data = await collectData(id);
          writeFileSync(
            path.join(__dirname, `../data/${id}.json`),
            JSON.stringify(data)
          );
          res.writeHead(200);
          res.end(JSON.stringify(data));
        } catch (e) {
          console.log(e);
          res.writeHead(500);
          res.end("Whoops, an error!\n" + e);
        }
      },
    },
  ],
});

bot.event("app_mention", async ({ event, client }) => {
  client.reactions.add({
    channel: event.channel,
    timestamp: event.ts,
    name: "robot_face",
  });
});

bot.command(env.COMMAND, async ({ command, ack, respond }) => {
  await ack();
  const data = await getData(command.user_id, respond);
  if (!data) return;
  respond({ text: "Got your data!" });
});

bot.start(3000);
