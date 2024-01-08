import { z } from "zod";

const envSchema = z.object({
  SLACK_TOKEN: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  SLACK_USER_TOKEN: z.string(),
});
export default envSchema.parse(process.env);
