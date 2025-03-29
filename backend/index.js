const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const { auth } = require("express-openid-connect");
const cors = require("cors");
const dotenv = require("dotenv");
const User = require("./model/UserSchema");

const app = express();
dotenv.config();
const PORT = 3000;

// Setup CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Session setup
app.use(
  session({
    secret: "a-very-secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);

// Auth0 config
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: `http://localhost:${process.env.PORT}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

app.use(auth(config));
require("./db/conn");

// Routes
app.get("/", (req, res) => {
  res.send('<a href="/login">Login</a>');
});

app.get("/profile", async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.status(401).send("Not logged in");

  const authUser = req.oidc.user;

  try {
    // Check if user already exists
    let user = await User.findOne({ email: authUser.email });
    if (!user) {
      // Create a new user if not found
      user = await User.create({
        name: authUser.name,
        email: authUser.email,
        picture: authUser.picture,
        Loyalty_Points: 100,
      });
      console.log("New user created:", user);
    } else {
      console.log("User already exists:", user);
    }

    res.json(user);
  } catch (err) {
    console.error("Error finding or creating user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/protected", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.json({ message: "This is protected data." });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

/*
app.get("/profile", (req, res) => {
  res.send(req.oidc.isAuthenticated() ? req.oidc.user : "Not logged in");
});

app.get("/api/protected", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.json({ message: "This is protected data." });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});


app.get("/profile", async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.status(401).send("Not logged in");

  const authUser = req.oidc.user;

  // Find or create user
  let user = await User.findOne({ email: authUser.email });
  if (!user) {
    user = await User.create({
      email: authUser.email,
      name: authUser.name,
      picture: authUser.picture,
    });
  }

  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
*/
