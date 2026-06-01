module.exports = {
  expo: {
    ...require('./app.json').expo,
    extra: {
      ...require('./app.json').expo.extra,
      apiBaseUrl: process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL,
    },
  },
};
