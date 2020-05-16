import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import babel from "rollup-plugin-babel";
import nodeBultins from "rollup-plugin-node-builtins";
import nodeGlobals from "rollup-plugin-node-globals";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

const extensions = [".js", ".jsx", ".ts", ".tsx", ".json", ".mjs"];
const distDir = "dist/client";

export default [
	{
		input: "./src/index.ts",
		plugins: [
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
			json(),
			production && terser({ output: { comments: false } }),
		],
		output: {
			dir: distDir,
			format: "esm",
			sourcemap: true,
		},
	},
];
