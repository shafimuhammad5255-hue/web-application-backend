import app from "./app.js";
import { connectDatabase } from "./database.js";

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
