module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: jsxImportSource here is all that's needed — no separate nativewind/babel preset
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
