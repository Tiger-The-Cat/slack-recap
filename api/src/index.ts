console.log("starting!");
import { App } from "@slack/bolt";
import env from "./utils/env";
import getData from "./getData";

export const bot = new App({
  token: env.SLACK_TOKEN,
  signingSecret: env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      path: "/api/src/index",
      method: ["GET"],
      handler: (req, res) => {
        res.writeHead(200);
        res.end(`Things are going just fine at ${req.headers.host}!`);
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

bot.command("/slack-recap", async ({ command, ack, respond }) => {
  await ack();
  const data = await getData(command.user_id, respond);
  if (!data) return;
  respond({ text: "Got your data!" });
});

bot.start(3000);
