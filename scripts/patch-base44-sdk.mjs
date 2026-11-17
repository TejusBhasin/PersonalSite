// Some @base44/sdk releases ship a dist/client.js that imports files which are
// missing from the published package (e.g. ./utils/build-commit.js, ./modules/voice.js).
// When the install on the build machine ends up with one of those gaps, the whole
// production build fails on an unresolved import. This app never needs those two
// modules' behaviour, so write harmless stubs for anything that is missing and let
// the build continue. Runs as "prebuild" so it happens on every build.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const STUBS = {
  'dist/utils/build-commit.js': [
    '// Auto-generated fallback: the published package omitted this file.',
    'export const BUILD_COMMIT_HEADER = "X-Base44-Build";',
    'export function getBuildCommitHeaders() {',
    '  return {};',
    '}',
    '',
  ].join('\n'),
  'dist/modules/voice.js': [
    '// Auto-generated fallback: the published package omitted this file.',
    'export function createVoiceModule() {',
    '  return {};',
    '}',
    'export default createVoiceModule;',
    '',
  ].join('\n'),
};

const log = (msg) => console.log(`[patch-base44-sdk] ${msg}`);

try {
  const require = createRequire(import.meta.url);
  const sdkRoot = path.dirname(require.resolve('@base44/sdk/package.json'));

  for (const [relative, contents] of Object.entries(STUBS)) {
    const target = path.join(sdkRoot, relative);
    if (fs.existsSync(target)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents, 'utf8');
    log(`wrote missing SDK file ${relative}`);
  }
  log('SDK file check complete');
} catch (error) {
  // Never fail the build from this safety net.
  log(`skipped (${error?.message || error})`);
}