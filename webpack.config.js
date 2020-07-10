const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: "./src/index.tsx",
	mode: process.env.NODE_ENV || "development",
	devServer: {
		contentBase: path.resolve(__dirname, "dist"),
	},
	output: {
		filename: "app.prod.js",
		path: path.resolve(__dirname, "dist"),
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader", "postcss-loader"],
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	plugins: [
		new CopyPlugin({
			patterns: [{ from: "public" }],
		}),
	],
};
