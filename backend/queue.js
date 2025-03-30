// In-memory queues
const loyalty_queue = []; // [{ song: { title, artist }, points }]
const free_queue = []; // [{ title, artist }]
const recommended_array = []; // [{ title, artist }]

// Add to Loyalty Queue (sorted by points, descending)
const addToLoyaltyQueue = (songObj, points) => {
  if (songObj && songObj.title && songObj.artist) {
    const cleanedSong = {
      title: songObj.title.replace(/["']/g, "").trim(),
      artist: songObj.artist.trim(),
    };

    loyalty_queue.push({ song: cleanedSong, points });
    loyalty_queue.sort((a, b) => b.points - a.points);
  } else {
    console.warn("❌ Invalid song object for loyalty queue:", songObj);
  }
};

// Add to Free Queue (append full song object)
const addToFreeQueue = (songObj) => {
  if (songObj && songObj.title && songObj.artist) {
    const cleanedSong = {
      title: songObj.title.replace(/["']/g, "").trim(),
      artist: songObj.artist.trim(),
    };
    free_queue.push(cleanedSong);
  } else {
    console.warn("❌ Invalid song object for free queue:", songObj);
  }
};

// Add to Recommended Array
const addToRecommendedArray = (songObj) => {
  if (songObj && songObj.title && songObj.artist) {
    const cleanedSong = {
      title: songObj.title.replace(/["']/g, "").trim(),
      artist: songObj.artist.trim(),
    };
    recommended_array.push(cleanedSong);
  } else {
    console.warn("❌ Invalid song object for recommended array:", songObj);
  }
};

// Export all queues and functions
module.exports = {
  loyalty_queue,
  free_queue,
  recommended_array,
  addToLoyaltyQueue,
  addToFreeQueue,
  addToRecommendedArray,
};
