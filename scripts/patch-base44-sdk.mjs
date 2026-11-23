// Published platform packages occasionally ship a dist file that imports a sibling
// which is missing from the copy installed on the build machine (a partial install,
// a stale cache, or a tarball that forgot the file). Either one breaks the whole
// production build on an unresolved import before any app code is even compiled.
//
// Each entry below writes a harmless, API-compatible stub ONLY when the real file is
// absent, so a healthy install is never touched. Runs before "vite build" on every
// build so the publish machine repairs itself.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const STUBS = [
  {
    pkg: '@base44/sdk',
    relative: 'dist/utils/build-commit.js',
    contents: [
      '// Auto-generated fallback: the installed package omitted this file.',
      'export const BUILD_COMMIT_HEADER = "X-Base44-Build";',
      'export function getBuildCommitHeaders() {',
      '  return {};',
      '}',
      '',
    ].join('\n'),
  },
  {
    pkg: '@base44/sdk',
    relative: 'dist/modules/voice.js',
    contents: [
      '// Auto-generated fallback: the installed package omitted this file.',
      'export function createVoiceModule() {',
      '  return {};',
      '}',
      'export default createVoiceModule;',
      '',
    ].join('\n'),
  },
  {
    // @base44/vite-plugin/dist/index.js imports this module at load time. When the
    // file is missing the build dies with ERR_MODULE_NOT_FOUND before Vite starts.
    pkg: '@base44/vite-plugin',
    relative: 'dist/hidden-source-maps-plugin.js',
    contents: [
      '// Auto-generated fallback: the installed package omitted this file.',
      '// Keeps the build alive; source maps are simply left as Vite emitted them.',
      'export function withHiddenSourceMaps(build) {',
      '  return build;',
      '}',
      'export function withoutSourcesContent(map) {',
      '  return map;',
      '}',
      'export function hiddenSourceMapsPlugin() {',
      '  return { name: "base44-hidden-source-maps-fallback" };',
      '}',
      '',
    ].join('\n'),
  },
];

const log = (msg) => console.log(`[patch-base44-sdk] ${msg}`);

const require = createRequire(import.meta.url);

// Some packages block resolving their own package.json through an "exports" map,
// so find the root by walking up from the resolved entry point instead.
function packageRoot(pkg) {
  let dir = path.dirname(require.resolve(pkg));
  for (let i = 0; i < 8; i++) {
    const manifest = path.join(dir, 'package.json');
    if (fs.existsSync(manifest)) {
      try {
        if (JSON.parse(fs.readFileSync(manifest, 'utf8')).name === pkg) return dir;
      } catch {
        /* keep walking */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

for (const stub of STUBS) {
  try {
    const root = packageRoot(stub.pkg);
    if (!root) {
      log(`could not locate ${stub.pkg}`);
      continue;
    }
    const target = path.join(root, stub.relative);
    if (fs.existsSync(target)) continue;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, stub.contents, 'utf8');
    log(`wrote missing file ${stub.pkg}/${stub.relative}`);
  } catch (error) {
    // Never fail the build from this safety net.
    log(`skipped ${stub.pkg}/${stub.relative} (${error?.message || error})`);
  }
}

log('package file check complete');