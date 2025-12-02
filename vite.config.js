const path = require(`node:path`)
const { defineConfig } = require(`vite`)

module.exports = defineConfig(async () => {
	const { default: bundleAudioWorkletPlugin } = await import(`./strudel/packages/vite-plugin-bundle-audioworklet/vite-plugin-bundle-audioworklet.js`)

	let project_root = __dirname
	let strudel_root = path.resolve(project_root, `strudel/packages`)

	let alias_values = {
		'@strudel.cycles': strudel_root,
		'@strudel': strudel_root,
		superdough: path.resolve(strudel_root, `superdough`),
		supradough: path.resolve(strudel_root, `supradough`),
	}

	return {
		resolve: {
			alias: alias_values,
		},
		plugins: [
			bundleAudioWorkletPlugin(),
		],
		build: {
			lib: {
				entry: path.resolve(project_root, `src/main.js`),
				name: `SlideBundle`,
				formats: [`iife`],
				fileName: () => `slide.bundle.js`,
			},
			rollupOptions: {
				output: {
					inlineDynamicImports: true,
					manualChunks: undefined,
					entryFileNames: `slide.bundle.js`,
				},
			},
			cssCodeSplit: false,
			target: `esnext`,
			emptyOutDir: true,
			assetsDir: `.`,
		},
	}
})
