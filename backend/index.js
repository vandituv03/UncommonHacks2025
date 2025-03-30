require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { auth } = require("express-openid-connect");
const cors = require("cors");
const SpotifyWebApi = require("spotify-web-api-node");
const User = require("./model/UserSchema");
const spotifySession = require("./spotifySession");
const { default: OpenAI } = require("openai/index.mjs");

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI = require("openai");
const openai = new OPENAI(process.env.OPENAI_API_KEY);

require("./db/conn");

let lastSearchedTrackName = null;

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URL,
});

async function ensureSpotifyAccessToken() {
  const { accessToken, refreshToken, expiresAt } = spotifySession.get();

  if (!accessToken || !refreshToken) {
    throw new Error(
      "❌ Spotify tokens not available. Please authenticate first.",
    );
  }

  // Check if token expired or about to expire in 60 sec
  if (Date.now() > expiresAt - 60_000) {
    console.log("🔄 Token expired or expiring soon. Refreshing...");

    const data = await spotifyApi.refreshAccessToken();
    const newAccessToken = data.body.access_token;
    const newExpiresIn = data.body.expires_in;

    spotifyApi.setAccessToken(newAccessToken);
    spotifySession.set({
      accessToken: newAccessToken,
      refreshToken,
      expiresIn: newExpiresIn,
    });

    console.log("✅ Access token refreshed");
  } else {
    // Token is valid — just re-apply it to Spotify API client
    spotifyApi.setAccessToken(accessToken);
  }
}

function recommendations(generatedContent) {
  try {
    const lines = generatedContent.split("\n").filter(Boolean);

    const cleaned = lines.map((line) => {
      // Remove leading symbols like '-', bullets, numbers
      line = line.replace(/^[-•\d.\s]+/, "").trim();

      // Remove wrapping quotes (single or double)
      line = line.replace(/^["']|["']$/g, "");

      // Split at " by " (case-insensitive)
      const [title, artist] = line.split(/ by /i);

      return {
        title: title?.trim() || "Unknown",
        artist: artist?.trim() || "Unknown",
      };
    });

    return cleaned;
  } catch (error) {
    console.error("Error parsing generated content:", error);
    return null;
  }
}

// CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Change to your frontend port if different
    credentials: true,
  }),
);

// Session
app.use(
  session({
    secret: "a-very-secret-key",
    resave: false,
    saveUninitialized: true,
  }),
);

// Auth0 config
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: `http://localhost:${PORT}`,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  }),
);
app.use(express.json());
// Home
app.get("/", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    // ✅ Redirect to the frontend app's landing page
    return res.redirect("http://localhost:5173/home");
  }
  res.send('<a href="/login">Login</a>');
});

// Authenticated profile
app.get("/profile", async (req, res) => {
  if (!req.oidc.isAuthenticated()) return res.status(401).send("Not logged in");

  const authUser = req.oidc.user;

  try {
    let user = await User.findOne({ email: authUser.email });
    if (!user) {
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
    console.error("User error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Protected route
app.get("/api/protected", (req, res) => {
  if (req.oidc.isAuthenticated()) {
    res.json({ message: "This is protected data." });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

// --- Spotify Login ---
app.get("/spotifylogin", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
  ];
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

// Adjust path as needed
app.post("/addpoints", async (req, res) => {
  const { email, points } = req.body;

  if (!email || typeof points !== "number" || points <= 0) {
    return res.status(400).send("❌ Invalid request");
  }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { Loyalty_Points: points } },
      { new: true },
    );

    if (!user) {
      return res.status(404).send("❌ User not found");
    }

    res.send({ updatedPoints: user.Loyalty_Points });
  } catch (err) {
    console.error("❌ Error updating points:", err);
    res.status(500).send("Server error");
  }
});

app.get("/leaderboard", async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ Loyalty_Points: -1 })
      .limit(5)
      .select("name email Loyalty_Points"); // select only needed fields

    res.json(topUsers);
  } catch (err) {
    console.error("❌ Error fetching leaderboard:", err);
    res.status(500).send("Server error");
  }
});

app.get("/spotifycallback", async (req, res) => {
  const { error, code } = req.query;

  if (error) {
    console.error("🔴 Spotify Error during login:", error);
    return res.status(400).send(`Error: ${error}`);
  }

  try {
    // Exchange code for access & refresh tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body["access_token"];
    const refreshToken = data.body["refresh_token"];
    const expiresIn = data.body["expires_in"]; // seconds

    // Set tokens into Spotify API client
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    // Store in memory (or DB if needed)
    spotifySession.set({ accessToken, refreshToken, expiresIn });

    console.log("✅ Spotify Access Token Set");
    console.log("🔁 Refresh Token Saved");

    // Optional: Start auto refresh every half expiry
    setInterval(
      async () => {
        try {
          const refreshed = await spotifyApi.refreshAccessToken();
          const newAccessToken = refreshed.body["access_token"];
          const newExpiresIn = refreshed.body["expires_in"];

          spotifyApi.setAccessToken(newAccessToken);
          spotifySession.set({
            accessToken: newAccessToken,
            refreshToken,
            expiresIn: newExpiresIn,
          });

          console.log("🔄 Token auto-refreshed");
        } catch (refreshErr) {
          console.error("🚫 Error refreshing token:", refreshErr);
        }
      },
      (expiresIn / 2) * 1000,
    ); // refresh before expiry
    return res.redirect("http://localhost:5173/home");
  } catch (err) {
    console.error("🚫 Token exchange error:", {
      message: err.message,
      body: err.body,
    });
    res.status(400).send("Error getting Spotify access token");
  }
});

app.get("/spotify-status", (req, res) => {
  const session = spotifySession.get();

  if (session?.accessToken) {
    return res.json({ loggedIn: true });
  } else {
    return res.json({ loggedIn: false });
  }
});

// --- Spotify Search ---

const {
  addToLoyaltyQueue,
  addToFreeQueue,
  addToRecommendedArray,
  getFinalQueue,
} = require("./queue");

app.post("/search", async (req, res) => {
  await ensureSpotifyAccessToken();

  const { search, type, points = 100 } = req.body;

  console.log("📥 Received search request:", { search, type, points });

  if (!search || !type) {
    console.warn("❌ Missing search or type in request");
    return res
      .status(400)
      .send("❌ 'search' and 'type' fields are required in the request body");
  }

  try {
    const formattedSearch = search.trim().replace(/\s+/g, "%20");
    console.log("🔍 Formatted search query for Spotify:", formattedSearch);

    const data = await spotifyApi.searchTracks(formattedSearch);

    if (data.body.tracks.items.length === 0) {
      console.warn("⚠️ No tracks found for:", search);
      return res.status(404).send("❌ No tracks found");
    }

    const track = data.body.tracks.items[0];
    lastSearchedTrackName = track.name; // Store the last searched track name

    const songObj = {
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
    };

    console.log("🎵 Track found:", songObj);

    // Add to the appropriate queue
    if (type === "bid") {
      if (typeof points !== "number") {
        console.warn("⚠️ Points missing for loyalty queue");
        return res
          .status(400)
          .send("❌ 'points' must be a number for loyalty queue");
      }
      addToLoyaltyQueue(songObj, points);
      console.log(`📦 Added to loyalty queue with ${points} points`);
    } else if (type === "free") {
      addToFreeQueue(songObj);
      console.log("📦 Added to free queue");
    } else if (type === "recommended") {
      addToRecommendedArray(songObj);
      console.log("📦 Added to recommended array");
    } else {
      console.warn("❌ Invalid type:", type);
      return res
        .status(400)
        .send("❌ Invalid type (use loyalty, free, or recommended)");
    }

    // ✅ Rebuild and log final queue
    const finalQueue = getFinalQueue();
    console.log("🎶 Final Playback Queue:");
    console.log(finalQueue); // nicely formatted output

    // ✅ Send it back to frontend
    res.send({
      status: "success",
      uri: track.uri,
      added: songObj,
      queue: type,
      ...(type === "loyalty" ? { points } : {}),
      finalQueue,
    });
  } catch (err) {
    console.error("🚨 Search error:", {
      status: err.statusCode,
      message: err.message,
      body: err.body,
    });
    res.status(500).send("Error searching track");
  }
});

// --- Spotify Play ---
app.get("/play", async (req, res) => {
  await ensureSpotifyAccessToken();

  const { uri } = req.query;
  if (!uri) return res.status(400).send("❌ Missing track URI");

  try {
    // Check for an active device
    const devices = await spotifyApi.getMyDevices();
    const activeDevice = devices.body.devices.find((d) => d.is_active);

    if (!activeDevice) {
      return res
        .status(400)
        .send(
          "❌ No active Spotify device found. Open Spotify and play a song first.",
        );
    }

    const playback = await spotifyApi.getMyCurrentPlayingTrack();

    if (!playback.body || !playback.body.item) {
      return res
        .status(400)
        .send(
          "❌ No track is currently playing. Please start playback in your Spotify app.",
        );
    }

    await spotifyApi.play({
      uris: [uri],
      device_id: activeDevice.id,
    });

    res.send("playing");
  } catch (err) {
    console.error("Play error:", {
      status: err.statusCode,
      message: err.message,
      body: err.body,
    });
    res.status(500).send("Error playing track");
  }
});

app.get("/gettracks", async (req, res) => {
  await ensureSpotifyAccessToken();

  const playback = await spotifyApi.getMyCurrentPlayingTrack();

  if (!playback.body || !playback.body.item) {
    return res
      .status(400)
      .send(
        "❌ No track is currently playing. Please start playback in your Spotify app.",
      );
  }

  const seedTrackId = playback.body.item.id;
  const trackName = playback.body.item.name;
  const artistName = playback.body.item.artists.map((a) => a.name).join(", ");

  console.log(`🎵 Seed track: ${trackName} (ID: ${seedTrackId})`);
  res.send({ track: trackName, artist: artistName });
});

// --- Spotify Recommendations ---

app.get("/recommendations", async (req, res) => {
  await ensureSpotifyAccessToken();

  try {
    const playback = await spotifyApi.getMyCurrentPlayingTrack();

    if (!playback.body || !playback.body.item) {
      return res
        .status(400)
        .send(
          "❌ No track is currently playing. Please start playback in your Spotify app.",
        );
    }

    const seedTrackId = playback.body.item.id;
    const trackName = playback.body.item.name;

    console.log(`🎵 Seed track: ${trackName} (ID: ${seedTrackId})`);

    //    trackName = "One Dance";

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an helpful assistant giving 10 best song recommendations for the song name provided by user matching similar vibe not necessarily same artist.",
          },
          {
            role: "user",
            content: `Give me 10 song recommendations for the song "${trackName}, do not provide the numbers or bullets or any symbols just list by new line"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      try {
        const generatedContent = response.choices[0].message.content;

        const parsedData = recommendations(generatedContent);
        // const parsedData = parseQuizTips(output.output);
        console.log(parsedData);

        res.json(parsedData);
      } catch (err) {
        console.log(err.data);
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred");
    }
  } catch (err) {
    console.error("No songs playing:", {
      status: err.statusCode,
      message: err.message,
      body: err.body,
    });
    res.status(500).send("Error playing track");
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
