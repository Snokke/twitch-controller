import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/plugin.ts",
  output: {
    file: "com.snake.twitch-controller.sdPlugin/bin/plugin.js",
    format: "es",
    sourcemap: true,
  },
  external: ["@elgato/streamdeck", "ws"],
  plugins: [
    resolve(),
    typescript(),
  ],
};
