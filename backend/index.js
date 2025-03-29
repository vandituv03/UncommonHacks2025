require("dotenv").config(); // Always load this at the top

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { auth } = require("express-openid-connect");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const User = require("./model/UserSchema");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
require("./db/conn"); // Make sure this connects properly

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URL,
});

// CORS setup
app.use(
  cors({
    origin: "http://localhost:${PORT}",
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

// Auth0 configuration
const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: `http://localhost:${PORT}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
};

// app.use(auth(authConfig));
require("./db/conn");

app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: "http://localhost:3000",
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  }),
);

// Routes
app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // ✅ Redirect to the frontend app's landing page
    return res.redirect("http://localhost:5173");
  }
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
// --- Spotify Auth Routes ---

app.get("/spotifylogin", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get("/spotifycallback", async (req, res) => {
  const { error, code } = req.query;

  if (error) {
    console.error("Spotify Error:", error);
    return res.send(`Error: ${error}`);
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];
    const expiresIn = data.body["expires_in"];

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    res.send("Spotify auth successful!");

    // Refresh token periodically
    setInterval(
      async () => {
        try {
          const data = await spotifyApi.refreshAccessToken();
          spotifyApi.setAccessToken(data.body["access_token"]);
          console.log("Access token refreshed");
        } catch (err) {
          console.error("Error refreshing token", err);
        }
      },
      (expiresIn / 2) * 1000,
    );
  } catch (err) {
    console.error("Token exchange error", err);
    res.send("Error getting access token");
  }
});

// --- Spotify Search & Play ---

app.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const data = await spotifyApi.searchTracks(q);
    if (data.body.tracks.items.length === 0) {
      return res.status(404).send("No tracks found");
    }

    const trackUri = data.body.tracks.items[0].uri;
    res.send({ uri: trackUri });
  } catch (err) {
    console.error("Search error", err);
    res.status(500).send(`Error searching: ${err.message}`);
  }
});

app.get("/play", async (req, res) => {
  const { uri } = req.query;
  try {
    await spotifyApi.play({ uris: [uri] });
    res.send("Playback started");
  } catch (err) {
    console.error("Play error", err);
    res.status(500).send(`Error playing: ${err.message}`);
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
