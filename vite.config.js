// vite.config.js
import { defineConfig } from `vite`
import path from `node:path`
import fg from `fast-glob`
// Import the plugin found in the official config
import bundleAudioWorkletPlugin from `vite-plugin-bundle-audioworklet`

export default defineConfig(() => {
  const project_root = __dirname

  // Custom import sorter (kept from your original config)
  const ordered_imports_plugin = () => {
    return {
      name: `ordered-imports`,
      enforce: `pre`,
      transform(code, id) {
        const entry_file = path.resolve(project_root, `entry.js`)

        if (id === entry_file) {
          const lib_files = fg.sync(`./src/libs/*.js`)
          const main_files = fg.sync([`./src/main/*.js`])

          let lines = []
          lines.push(`import "./src/app.js"`)
          lines.push(`import "./src/mixer.js"`)
          lib_files.forEach((file) => lines.push(`import "./${file}"`))
          main_files.forEach((file) => lines.push(`import "./${file}"`))

          return { code: lines.join(`\n`), map: null }
        }
      },
    }
  }

  return {
    plugins: [
      // The official plugin handles bundling the worklet
      // and resolving internal imports like 'ola-processor'
      bundleAudioWorkletPlugin(),
      ordered_imports_plugin()
    ],
    build: {
      lib: {
        entry: path.resolve(project_root, `entry.js`),
        name: `SlideBundle`,
        formats: [`iife`],
        fileName: () => `strudel.bundle.js`,
      },
      rollupOptions: {
        output: { inlineDynamicImports: true },
      },
      target: `esnext`,
      emptyOutDir: true,
      assetsDir: `.`,
    },
  }
})