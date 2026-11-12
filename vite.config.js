import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Some @base44/sdk builds ship a client that imports "./modules/voice.js" without
// including that file, which breaks the production build. This app never uses the
// voice module, so resolve it to a harmless stub when the file is missing.
const sdkVoiceFallback = {
  name: 'base44-sdk-voice-fallback',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !importer.includes('@base44/sdk')) return null;
    if (source !== './modules/voice.js') return null;
    const target = path.resolve(path.dirname(importer), 'modules', 'voice.js');
    if (fs.existsSync(target)) return null;
    return '\0base44-sdk-voice-stub';
  },
  load(id) {
    if (id === '\0base44-sdk-voice-stub') {
      return 'export const createVoiceModule = () => ({});\nexport default createVoiceModule;';
    }
    return null;
  },
};

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    sdkVoiceFallback,
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