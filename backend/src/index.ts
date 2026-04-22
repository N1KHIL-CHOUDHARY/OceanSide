import "dotenv/config";

import { start } from "./server";

void start().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
