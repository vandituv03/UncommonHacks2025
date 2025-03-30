let spotifyTokens = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null, // timestamp in ms
};

module.exports = {
  get: () => spotifyTokens,
  set: ({ accessToken, refreshToken, expiresIn }) => {
    spotifyTokens.accessToken = accessToken;
    spotifyTokens.refreshToken = refreshToken;
    spotifyTokens.expiresAt = Date.now() + expiresIn * 1000;
  },
};
