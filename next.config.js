module.exports = (phase, { defaultConfig }) => {
  return {
    ...defaultConfig,
    future: {
      webpack5: true
    }
  };
};