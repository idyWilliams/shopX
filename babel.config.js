module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: jsxImportSource here is all that's needed — no separate nativewind/babel preset
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Decorators MUST come before class-properties.
      // All three class-feature plugins must share the same 'loose' setting.
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-proposal-class-properties", { loose: true }],
      "react-native-reanimated/plugin",
    ],
  };
};
