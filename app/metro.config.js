// Learn more https://docs.expo.dev/guides/monorepos/#metro-config
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Node "package exports" resolution. With it on, Metro picks the ESM
// build of some packages (e.g. zustand's `esm/middleware.mjs`) which contains
// an unguarded `import.meta.env` reference — that's invalid inside Metro's
// CommonJS module wrapper and crashes with "Cannot use 'import.meta' outside
// a module". Falling back to each package's plain CJS entry avoids it.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
