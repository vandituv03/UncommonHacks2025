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

// function recommendations(generatedContent) {
//   try {
//     const lines = generatedContent.split("\n").filter(Boolean);

//     const cleaned = lines.map((line) => {
//       // Remove leading symbols like '-', bullets, numbers
//       line = line.replace(/^[-•\d.\s]+/, "").trim();

//       // Remove wrapping quotes (single or double)
//       line = line.replace(/^["']|["']$/g, "");

//       // Split at " by " (case-insensitive)
//       const [title, artist] = line.split(/ by /i);

//       return {
//         title: title?.trim() || "Unknown",
//         artist: artist?.trim() || "Unknown",
//       };
//     });

//     return cleaned;
//   } catch (error) {
//     console.error("Error parsing generated content:", error);
//     return null;
//   }
// }

function recommendations(generatedContent) {
  try {
    const lines = generatedContent.split("\n").filter(Boolean);

    const cleaned = lines.map((line) => {
      // Remove leading symbols like '-', bullets, numbers
      line = line.replace(/^[-•\d.\s]+/, "").trim();

      // Remove wrapping quotes (single or double)
      line = line.replace(/^["']|["']$/g, "");

      // Prefer splitting by dash if present
      let title = line;
      let artist = "Unknown";

      if (line.includes(" - ")) {
        [title, artist] = line.split(" - ");
      } else if (line.includes(" by ")) {
        [title, artist] = line.split(/ by /i);
      }

      return {
        title: title.trim(),
        artist: artist.trim(),
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
        Total_Bids: user.Total_Bids,
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

app.post("/spotify-play", async (req, res) => {
  try {
    await ensureSpotifyAccessToken();

    const playback = await spotifyApi.getMyCurrentPlaybackState();
    const deviceId = playback.body?.device?.id;

    if (!deviceId) {
      return res.status(400).send("❌ No active device found");
    }

    await spotifyApi.play({ device_id: deviceId });
    res.send("▶️ Playback started");
  } catch (err) {
    console.error("❌ Error in /spotify-play:", err.message);
    res.status(500).send("Failed to start playback");
  }
});

app.post("/spotify-pause", async (req, res) => {
  try {
    await ensureSpotifyAccessToken();
    await spotifyApi.pause();
    res.send("⏸ Playback paused");
  } catch (err) {
    console.error("❌ Error in /spotify-pause:", err.message);
    res.status(500).send("Failed to pause playback");
  }
});

app.post("/spotify-next", async (req, res) => {
  try {
    await ensureSpotifyAccessToken();
    await spotifyApi.skipToNext();
    res.send("⏭ Skipped to next track");
  } catch (err) {
    console.error("❌ Error in /spotify-next:", err.message);
    res.status(500).send("Failed to skip to next track");
  }
});

app.post("/spotify-previous", async (req, res) => {
  try {
    await ensureSpotifyAccessToken();
    await spotifyApi.skipToPrevious();
    res.send("⏮ Skipped to previous track");
  } catch (err) {
    console.error("❌ Error in /spotify-previous:", err.message);
    res.status(500).send("Failed to skip to previous track");
  }
});

app.post("/search", async (req, res) => {
  await ensureSpotifyAccessToken();

  const { search, type, email, points = 100 } = req.body;
  console.log("📥 Received search request:", { search, type, points });

  if (!search || !type || !email) {
    return res.status(400).send("❌ 'search', 'type' and 'email' are required");
  }

  // 1. 🚫 Block inappropriate or meme keywords
  const blockedKeywords = ["fart", "earrape", "moan", "rickroll", "scream"];
  const isBlocked = blockedKeywords.some((word) =>
    search.toLowerCase().includes(word),
  );
  if (isBlocked) {
    return res
      .status(400)
      .send("❌ That request isn't allowed. Try something else.");
  }

  try {
    const formattedSearch = search.trim().replace(/\s+/g, "%20");
    const data = await spotifyApi.searchTracks(formattedSearch);

    if (data.body.tracks.items.length === 0) {
      return res.status(404).send("❌ No tracks found");
    }

    const track = data.body.tracks.items[0];
    const trackUri = track.uri;
    const popularity = track.popularity;

    lastSearchedTrackName = track.name;

    const songObj = {
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
    };

    console.log("🎵 Found track:", songObj, `(popularity: ${popularity})`);

    // 2. 🚫 Reject super obscure tracks
    if (popularity < 10) {
      return res.status(400).send("❌ This song is too obscure to request.");
    }

    // 3. 💰 Adjust bid price based on popularity
    let minBid = 100;
    if (popularity < 30) minBid = 300;
    if (popularity < 20) minBid = 500;

    if (type === "bid" && points < minBid) {
      return res
        .status(400)
        .send(`❌ This song requires a minimum bid of ${minBid} points.`);
    }

    // 4. Update User Stats
    const userUpdate = {
      $inc: {
        Total_Bids: 1,
        ...(type === "bid" ? { Loyalty_Points: -points } : {}),
      },
    };

    await User.findOneAndUpdate({ email }, userUpdate, { new: true });

    // 5. Add to correct queue
    if (type === "bid") {
      addToLoyaltyQueue(songObj, points);
      console.log(`📦 Added to loyalty queue with ${points} points`);
    } else if (type === "free") {
      addToFreeQueue(songObj);
      console.log("📦 Added to free queue");
    } else if (type === "recommended") {
      addToRecommendedArray(songObj);
      console.log("📦 Added to recommended array");
    } else {
      return res
        .status(400)
        .send("❌ Invalid type (bid, free, or recommended)");
    }

    const finalQueue = getFinalQueue();

    return res.send({
      uri: trackUri,
      type,
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

const { popNextFromQueue } = require("./queue");

app.get("/play", async (req, res) => {
  await ensureSpotifyAccessToken();

  const nextTrack = popNextFromQueue(); // removes from your in-memory queue
  if (!nextTrack) return res.status(400).send("❌ Queue is empty");

  try {
    const simplifiedQuery = `${nextTrack.title} ${nextTrack.artist}`;
    const result = await spotifyApi.searchTracks(simplifiedQuery, { limit: 3 });

    if (!result.body.tracks.items.length) {
      return res
        .status(404)
        .send(`❌ Could not find "${nextTrack.title}" on Spotify`);
    }

    // Try to find the best matching track
    let track = result.body.tracks.items.find((item) =>
      item.name.toLowerCase().includes(nextTrack.title.toLowerCase()),
    );

    // Fallback to first result if no fuzzy match
    if (!track) {
      track = result.body.tracks.items[0];
    }

    const trackUri = track.uri;
    const trackName = track.name;
    const trackArtists = track.artists.map((a) => a.name).join(", ");

    const devices = await spotifyApi.getMyDevices();
    const activeDevice = devices.body.devices.find((d) => d.is_active);

    if (!activeDevice) {
      return res
        .status(400)
        .send(
          "❌ No active Spotify device found. Open Spotify and play a song first.",
        );
    }

    const deviceId = activeDevice.id;

    // ✅ Force playback of only this track, override queue
    await spotifyApi.play({
      device_id: deviceId,
      uris: [trackUri],
      offset: { position: 0 },
    });

    // 🛑 Optional: turn off repeat
    await spotifyApi.setRepeat("off", { device_id: deviceId });

    console.log(`▶️ Playing: ${trackName} by ${trackArtists}`);
    res.send(`▶️ Now playing: ${trackName} by ${trackArtists}`);
  } catch (err) {
    console.error("❌ Spotify play error:", err?.body || err.message);
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

    // 🔮 Ask OpenAI for recommendations
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant giving 10 song recommendations with a similar vibe to the song provided. Format: 'Title - Artist'. Do not use bullets or numbering.",
        },
        {
          role: "user",
          content: `Give me 10 song recommendations for the song "${trackName}".`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    const generatedContent = response.choices[0].message.content;

    // ✂️ Parse and clean recommendations
    const lines = generatedContent.split("\n").filter(Boolean);
    const parsedData = lines.map((line) => {
      line = line.replace(/^[-•\d.\s]+/, "").trim(); // remove bullets/numbers
      line = line.replace(/^["']|["']$/g, ""); // remove quotes

      let title = line;
      let artist = "Unknown";

      if (line.includes(" - ")) {
        [title, artist] = line.split(" - ");
      } else if (line.includes(" by ")) {
        [title, artist] = line.split(/ by /i);
      }

      return {
        title: title.trim(),
        artist: artist.trim(),
      };
    });

    const successfullyAdded = [];

    // 🔍 Lookup on Spotify and add valid results
    for (const entry of parsedData) {
      try {
        const query = `track:${entry.title} artist:${entry.artist}`;
        const result = await spotifyApi.searchTracks(query, { limit: 1 });

        if (result.body.tracks.items.length > 0) {
          const track = result.body.tracks.items[0];

          const songObj = {
            title: track.name,
            artist: track.artists.map((a) => a.name).join(", "),
          };

          addToRecommendedArray(songObj);
          successfullyAdded.push(songObj);
          console.log("✅ Added to recommended:", songObj);
        } else {
          console.warn(`⚠️ Spotify search failed for: ${entry.title}`);
        }
      } catch (err) {
        console.error(`🚨 Spotify error for "${entry.title}":`, err.message);
      }
    }

    res.json(successfullyAdded); // send back added tracks
  } catch (err) {
    console.error("❌ Error in /recommendations:", err);
    res.status(500).send("Error generating recommendations");
  }
});

app.get("/queue", (req, res) => {
  try {
    const finalQueue = getFinalQueue();
    res.json(finalQueue);
  } catch (err) {
    console.error("❌ Error getting queue:", err.message);
    res.status(500).send("Failed to fetch queue");
  }
});

// 🧠 TRACK MONITORING LOGIC
let lastTrackId = null;
let lastIsPlaying = false;

async function monitorPlayback() {
  try {
    await ensureSpotifyAccessToken();

    const playback = await spotifyApi.getMyCurrentPlayingTrack();
    const currentTrackId = playback?.body?.item?.id;
    const isPlaying = playback?.body?.is_playing;

    // 🎵 Trigger recommendations on track change
    if (currentTrackId && currentTrackId !== lastTrackId) {
      lastTrackId = currentTrackId;
      console.log(`🎵 New track detected: ${playback.body.item.name}`);
      await fetch(`http://localhost:${PORT}/recommendations`);
      console.log("📡 Triggered /recommendations");
    }

    // 🛑 If previously playing and now not playing => track ended
    if (lastIsPlaying && !isPlaying) {
      console.log("⏹️ Track ended — triggering /play for next track");
      await fetch(`http://localhost:${PORT}/play`);
    }

    lastIsPlaying = isPlaying;
  } catch (err) {
    console.error("❌ Error in monitorPlayback:", err.message);
  }
}

setInterval(monitorPlayback, 7000);

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
