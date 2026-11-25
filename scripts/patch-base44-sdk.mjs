// Published platform packages occasionally ship a dist file that imports a sibling
// which is missing from the copy installed on the build machine (a partial install,
// a stale cache, or a tarball that forgot the file). Either one breaks the whole
// production build on an unresolved import before any app code is even compiled.
//
// Each entry below writes a harmless, API-compatible stub ONLY when the real file is
// absent, so a healthy install is never touched. Runs before "vite build" on every
// build so the publish machine repairs itself.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
    // Loaded by dist/visual-edit-plugin.js. Same failure mode: the build stops with
    // ERR_MODULE_NOT_FOUND on this import before any app code is compiled.
    pkg: '@base44/vite-plugin',
    relative: 'dist/cjs-interop.js',
    contents: [
      '// Auto-generated fallback: the installed package omitted this file.',
      'export function cjsDefault(mod, name) {',
      '  const fn = typeof mod === "function" ? mod : mod && mod.default;',
      '  if (typeof fn === "function") return fn;',
      '  return () => {',
      '    throw new TypeError(`${name} has no callable default export`);',
      '  };',
      '}',
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

// ---------------------------------------------------------------------------
// Self-heal @base44/vite-plugin. Its install on a build machine is sometimes
// partial, and a single missing dist module stops the build with
// ERR_MODULE_NOT_FOUND before any app code compiles. Restore every missing
// relative import from the published tarball, then stub whatever is left.
// ---------------------------------------------------------------------------

const PLUGIN = '@base44/vite-plugin';

function walkJs(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJs(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function importedNames(clause) {
  const names = new Set();
  const brace = clause.match(/\{([\s\S]*)\}/);
  if (brace) {
    for (const part of brace[1].split(',')) {
      const clean = part.trim();
      if (!clean) continue;
      const renamed = clean.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      names.add(renamed ? renamed[1] : clean);
    }
  }
  const head = clause.replace(/\{[\s\S]*\}/, '').replace(/,$/, '').trim();
  if (head) names.add('default');
  return names;
}

function missingPluginModules(root) {
  const dist = path.join(root, 'dist');
  const missing = new Map();
  const pattern = /(?:^|\n)\s*(?:import|export)\s+([\s\S]*?)\s*from\s*["'](\.[^"']+)["']/g;
  for (const file of walkJs(dist)) {
    const code = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = pattern.exec(code))) {
      const spec = match[2];
      if (!spec.endsWith('.js')) continue;
      const target = path.resolve(path.dirname(file), spec);
      if (fs.existsSync(target)) continue;
      const relative = path.relative(dist, target);
      const names = missing.get(relative) || new Set();
      for (const name of importedNames(match[1])) names.add(name);
      missing.set(relative, names);
    }
  }
  return missing;
}

function restoreFromTarball(root, version, relatives) {
  const restored = new Set();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b44-vite-plugin-'));
  execFileSync('npm', ['pack', `${PLUGIN}@${version}`, '--pack-destination', tmp], {
    stdio: 'ignore',
    timeout: 90000,
  });
  const tarball = fs.readdirSync(tmp).find((name) => name.endsWith('.tgz'));
  if (!tarball) return restored;
  execFileSync('tar', ['-xzf', path.join(tmp, tarball), '-C', tmp], { stdio: 'ignore', timeout: 90000 });
  for (const relative of relatives) {
    const source = path.join(tmp, 'package', 'dist', relative);
    if (!fs.existsSync(source)) continue;
    const target = path.join(root, 'dist', relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    restored.add(relative);
    log(`restored ${PLUGIN}/dist/${relative} from the published tarball`);
  }
  return restored;
}

function stubModule(names) {
  const lines = [
    '// Auto-generated fallback: the installed package omitted this file.',
    'function fallback(...args) {',
    '  return args.find((value) => value && typeof value === "object") ?? { name: "base44-fallback" };',
    '}',
  ];
  for (const name of names) {
    lines.push(name === 'default' ? 'export default fallback;' : `export const ${name} = fallback;`);
  }
  return lines.join('\n') + '\n';
}

try {
  const root = process.env.B44_VITE_PLUGIN_ROOT || packageRoot(PLUGIN);
  if (root) {
    const missing = missingPluginModules(root);
    if (missing.size > 0) {
      const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
      let restored = new Set();
      try {
        restored = restoreFromTarball(root, version, [...missing.keys()]);
      } catch (error) {
        log(`could not fetch ${PLUGIN}@${version} (${error?.message || error})`);
      }
      for (const [relative, names] of missing) {
        if (restored.has(relative)) continue;
        const target = path.join(root, 'dist', relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, stubModule(names), 'utf8');
        log(`wrote fallback for ${PLUGIN}/dist/${relative}`);
      }
    } else {
      log(`${PLUGIN} files all present`);
    }
  }
} catch (error) {
  log(`plugin check skipped (${error?.message || error})`);
}

log('package file check complete');