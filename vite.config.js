import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Some @base44/sdk builds ship a client that imports files the package forgot to
// include (./utils/build-commit.js, ./modules/voice.js). Either one breaks the
// production build on an unresolved import. This app does not use their behaviour,
// so resolve a missing file to a harmless stub instead of failing the build.
const SDK_FALLBACKS = {
  'modules/voice.js': [
    'export function createVoiceModule() {',
    '  return {};',
    '}',
    'export default createVoiceModule;',
  ].join('\n'),
  'utils/build-commit.js': [
    'export const BUILD_COMMIT_HEADER = "X-Base44-Build";',
    'export function getBuildCommitHeaders() {',
    '  return {};',
    '}',
  ].join('\n'),
};

const STUB_PREFIX = '\0base44-sdk-missing-file:';

const sdkMissingFileFallback = {
  name: 'base44-sdk-missing-file-fallback',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !importer.includes('@base44/sdk')) return null;
    if (!source.startsWith('./')) return null;
    const relative = source.slice(2);
    if (!SDK_FALLBACKS[relative]) return null;
    const target = path.resolve(path.dirname(importer), relative);
    if (fs.existsSync(target)) return null;
    return STUB_PREFIX + relative;
  },
  load(id) {
    if (!id.startsWith(STUB_PREFIX)) return null;
    return SDK_FALLBACKS[id.slice(STUB_PREFIX.length)];
  },
};

// Heavy third-party libraries are emitted as their own chunks. Besides keeping the
// first load small, this keeps pre-minified vendor code in separate module scopes:
// concatenated into the single app chunk it produced duplicate top-level bindings,
// and the published bundle failed to parse (a blank page on every route).
const VENDOR_CHUNKS = [
  ['monaco', ['@monaco-editor', '/monaco-editor/']],
  ['three', ['/three/']],
  ['audio-meta', ['music-metadata', 'strtok3', 'token-types', 'readable-web-to-node-stream', '/debug/']],
  ['mega', ['megajs']],
  ['dash', ['dashjs']],
  ['pdf', ['jspdf', 'html2canvas']],
  ['charts', ['recharts', '/d3-']],
];

function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined;
  for (const [chunk, markers] of VENDOR_CHUNKS) {
    if (markers.some((marker) => id.includes(marker))) return chunk;
  }
  return undefined;
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
  plugins: [
    sdkMissingFileFallback,
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ],
});