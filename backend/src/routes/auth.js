import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const cookieName = "auth_token";
const tokenLifetimeSeconds = 7 * 24 * 60 * 60;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

function setAuthCookie(response, userId) {
  const token = jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: tokenLifetimeSeconds
  });
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: tokenLifetimeSeconds * 1000,
    path: "/"
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post("/signup", async (request, response, next) => {
  try {
    const name = typeof request.body.name === "string" ? request.body.name.trim() : "";
    const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const password = typeof request.body.password === "string" ? request.body.password : "";

    if (!name || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return response.status(400).json({ error: "Enter a valid name and email address." });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return response.status(400).json({ error: "Password must be at least 8 characters and no more than 72 bytes." });
    }

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return response.status(409).json({ error: "An account with that email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    });
    setAuthCookie(response, user.id);
    return response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({ error: "An account with that email already exists." });
    }
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const email = typeof request.body.email === "string" ? request.body.email.trim().toLowerCase() : "";
    const password = typeof request.body.password === "string" ? request.body.password : "";
    if (!email || !password) {
      return response.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ error: "Invalid email or password." });
    }

    setAuthCookie(response, user.id);
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (_request, response) => {
  response.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/"
  });
  response.status(204).end();
});

router.get("/me", async (request, response) => {
  try {
    const token = request.cookies[cookieName];
    if (!token) {
      return response.status(401).json({ error: "Not authenticated." });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub);
    if (!user) {
      return response.status(401).json({ error: "Not authenticated." });
    }
    return response.json({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return response.status(401).json({ error: "Not authenticated." });
    }
    console.error("Failed to load current user:", error);
    return response.status(500).json({ error: "Internal server error" });
  }
});

export default router;
