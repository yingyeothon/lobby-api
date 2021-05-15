const path = require("path");
const slsw = require("serverless-webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  entry: slsw.lib.entries,
  resolve: {
    extensions: [".mjs", ".json", ".ts", ".js"],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  target: "node",
  externals: [/aws-sdk/],
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
  },
  plugins:
    process.env.ANALYZE_BUNDLE === "1" ? [new BundleAnalyzerPlugin()] : [],
};
