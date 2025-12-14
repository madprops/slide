// vite.config.js
import { defineConfig } from `vite`;
import path from `node:path`;
import fg from `fast-glob`;

export default defineConfig(() => {
  const project_root = __dirname;

  // Keep your custom import sorter
  const ordered_imports_plugin = () => {
    return {
      name: `ordered-imports`,
      enforce: `pre`,
      transform(code, id) {
        const entry_file = path.resolve(project_root, `entry.js`);
        if (id === entry_file) {
          const lib_files = fg.sync(`./src/libs/*.js`);
          // Exclude app.js to handle it manually if needed
          const main_files = fg.sync([`./src/main/*.js`, `!./src/main/app.js`]);

          let lines = [];
          lines.push(`import "./src/app.js"`);
          lib_files.forEach((file) => lines.push(`import "./${file}"`));
          main_files.forEach((file) => lines.push(`import "./${file}"`));

          return { code: lines.join(`\n`), map: null };
        }
      },
    };
  };

  return {
    // No aliases needed!
    // No dedupe needed! (NPM handles this)
    plugins: [ordered_imports_plugin()],
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
  };
});