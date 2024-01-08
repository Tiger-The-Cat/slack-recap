console.log("starting!");
import { App } from "@slack/bolt";
import env from "./utils/env";
import getData from "./getData";
import allChannels, { getChannels } from "./utils/allChannels";
import cookieParser from "cookie-parser";
import express from "express";
import * as nunjucks from "nunjucks";

const train = express(); // very intuitive naming i know
train.use(cookieParser());

nunjucks.configure("views", {
  autoescape: true,
  express: train,
}); // we'll see if this works later...

export const bot = new App({
  token: env.SLACK_TOKEN,
  signingSecret: env.SLACK_SIGNING_SECRET,
  customRoutes: [
    {
      method: ["GET"],
      path: "/",
      handler: async (req, res) => {
        res.writeHead(200);
        res.end(`Things are going just fine at ${req.headers.host}!`);
      },
    },
  ],
});
getChannels();

bot.event("app_mention", async ({ event, client }) => {
  client.reactions.add({
    channel: event.channel,
    timestamp: event.ts,
    name: "robot_face",
  });
});

train.get("/", (req, res) => {
  res.writeHead(200);
  res.end(`Things are going just fine at ${req.headers.host}!`);
});

train.get("/debug/channels", async (req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify(allChannels));
});

train.get("/data/:id", async (req, res) => {
  const data = await getData(req.params.id);
  res.status(200);
  res.send(data);
});

bot.start(2300);
train.listen(3000);
