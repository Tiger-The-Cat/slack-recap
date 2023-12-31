import { App } from "@slack/bolt";
import env from "./utils/env";

const bot = new App({
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
  ],
});

bot.event("app_mention", async ({ event, client }) => {
  client.reactions.add({
    channel: event.channel,
    timestamp: event.ts,
    name: "robot_face",
  });
});

bot.start(3000);
