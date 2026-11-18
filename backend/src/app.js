import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import authRouter from "./routes/auth.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false
  }),
  authRouter
);

app.use((error, _request, response, _next) => {
  console.error("Unhandled API error:", error);
  response.status(500).json({ error: "Internal server error" });
});

export default app;
