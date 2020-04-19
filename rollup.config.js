import html from "@rollup/plugin-html";
import resolve from "@rollup/plugin-node-resolve";
import babel from "rollup-plugin-babel";
import nodeBultins from "rollup-plugin-node-builtins";
import nodeGlobals from "rollup-plugin-node-globals";
import postcss from "rollup-plugin-postcss";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

const extensions = [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs"];
const distDir = "dist/client";
const plugins = (...args) => [
	svelte({ dev: !production }),
	resolve({
		browser: true,
		extensions,
		preferBuiltins: true,
		dedupe: ["svelte"],
	}),
	commonjs(),
	nodeBultins(),
	nodeGlobals(),
	babel({
		extensions,
		include: ["src/*", "src/**/*"],
		presets: ["@babel/preset-typescript", "@babel/preset-modules"],
	}),
	...args,
	production && terser({ output: { comments: false } }),
];

export default [
	{
		input: "./src/index.ts",
		plugins: plugins(
			postcss({
				extensions: [".scss", ".sass"],
				extract: false,
				minimize: true,
				use: [
					[
						"sass",
						{
							includePaths: ["./src/", "./node_modules"],
						},
					],
				],
			}),
			html({
				template,
			}),
		),
		output: {
			dir: distDir,
			format: "esm",
			sourcemap: true,
		},
	},
	{
		input: "./src/data/worker.ts",
		plugins: plugins(),
		globals: {
			global: "self",
		},
		output: {
			dir: distDir,
			format: "iife",
			sourcemap: true,
		},
	},
];

function template({ attributes, bundle, files, publicPath, title }) {
	const scripts = files.js
		.map(({ fileName }) => `<script type="module" src="${fileName}" defer></script>`)
		.join("\n");
	const styles = [
		{ fileName: "https://fonts.googleapis.com/icon?family=Material+Icons" },
		{
			fileName: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,600,700",
		},
		{ fileName: "https://fonts.googleapis.com/css?family=Roboto+Mono" },
	]
		.concat(files.css || [])
		.map(({ fileName }) => `<link rel="stylesheet" href="${fileName}">`)
		.join("\n");

	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Topz</title>
		${styles}
	</head>
	<body>
	${scripts}
	</body>
	</html>`;
}
