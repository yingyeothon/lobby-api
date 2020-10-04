/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const slsw = require("serverless-webpack");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

module.exports = {
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  entry: slsw.lib.entries,
  // devtool: "source-map",
  resolve: {
    extensions: [".js", ".jsx", ".json", ".ts", ".tsx"],
  },
  output: {
    libraryTarget: "commonjs",
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
  optimization: {
    usedExports: true,
  },
  // plugins: [new BundleAnalyzerPlugin()]
};
