import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { connectDatabase } from "./database.js";

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const port = Number(process.env.PORT || 4000);

try {
  await connectDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
} catch (error) {
  console.error("Failed to start API:", error);
  process.exit(1);
}
