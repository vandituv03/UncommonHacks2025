// In-memory queues
const loyalty_queue = []; // [{ song: { title, artist }, points }]
const free_queue = []; // [{ title, artist }]
const recommended_array = []; // [{ title, artist }]

// Utility: Clean and validate a song object
const cleanSong = (songObj) => {
  if (songObj && songObj.title && songObj.artist) {
    return {
      title: songObj.title.replace(/["']/g, "").trim(),
      artist: songObj.artist.trim(),
    };
  }
  return null;
};

// 🎯 Add to Loyalty Queue (priority queue with stable insert)
const addToLoyaltyQueue = (songObj, points) => {
  const cleanedSong = cleanSong(songObj);
  if (!cleanedSong) {
    console.warn("❌ Invalid song object for loyalty queue:", songObj);
    return;
  }

  const newEntry = { song: cleanedSong, points };
  let inserted = false;

  for (let i = 0; i < loyalty_queue.length; i++) {
    if (points > loyalty_queue[i].points) {
      loyalty_queue.splice(i, 0, newEntry);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    loyalty_queue.push(newEntry);
  }
};

// 🎵 Add to Free Queue (append at end)
const addToFreeQueue = (songObj) => {
  const cleanedSong = cleanSong(songObj);
  if (!cleanedSong) {
    console.warn("❌ Invalid song object for free queue:", songObj);
    return;
  }
  free_queue.push(cleanedSong);
};

// 🔥 Add single song to Recommended Array
const addToRecommendedArray = (songObj) => {
  const cleanedSong = cleanSong(songObj);
  if (!cleanedSong) {
    console.warn("❌ Invalid song object for recommended array:", songObj);
    return;
  }
  recommended_array.push(cleanedSong);
};

// 🎧 Final playback queue: loyalty ➝ free ➝ recommended
const getFinalQueue = () => {
  const result = [];

  // From loyalty_queue
  for (const entry of loyalty_queue) {
    result.push({
      title: entry.song.title,
      artist: entry.song.artist,
    });
  }

  // From free_queue
  for (const song of free_queue) {
    result.push({
      title: song.title,
      artist: song.artist,
    });
  }

  // From recommended_array
  for (const song of recommended_array) {
    result.push({
      title: song.title,
      artist: song.artist,
    });
  }

  return result;
};

// ✅ Export everything
module.exports = {
  loyalty_queue,
  free_queue,
  recommended_array,
  addToLoyaltyQueue,
  addToFreeQueue,
  addToRecommendedArray,
  getFinalQueue,
};
