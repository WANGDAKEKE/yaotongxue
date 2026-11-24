#!/usr/bin/env node
// Package only the project-owned copy. Signing and launching are separate steps.
import fs from 'node:fs';
import {vendorRoot, loadAsar} from './paths.mjs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { applyNativeVisibleResources } from './native-visible-copy.mjs';
import { buildNativeEntry } from './build-native-entry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localRoot = path.dirname(root);

const originalApp = path.join(vendorRoot, 'app/ChatGPT.app');
const originalTree = path.join(vendorRoot, 'extracted-app');
const originalAsar = path.join(originalApp, 'Contents/Resources/app.asar');
const buildRoot = path.join(root, 'build');
const stagedTree = path.join(buildRoot, 'asar');
const outputApp = path.join(root, 'app/姚同学.app');
const tempTree = path.join(buildRoot, `.asar-packing-${process.pid}`);
const tempApp = path.join(root, 'app', `.影擎-packing-${process.pid}.app`);
const bundleId = 'local.tencentvideo.yaotongxue';
const displayName = '姚同学';
const appName = '姚同学';
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help') {
    console.log('Usage: node package-app.mjs [--source FULL_ASAR_TREE] [--overlay DIR] [--icon FILE.icns]');
    console.log('Output: build/asar and app/姚同学.app. Does not sign or launch.');
    process.exit(0);
  }
  if (!['--source', '--overlay', '--icon'].includes(arg) || !args[i + 1]) {
    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  options[arg.slice(2)] = path.resolve(args[++i]);
}
const sourceTree = options.source ?? originalTree;
// Keep the macOS launcher artwork separate from in-app/native brand resources.
const launcherIcon = options.icon ?? path.join(root, 'assets/launcher-icon.icns');
const asar = await loadAsar();
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const edits = [];

function assertOwned(target) {
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to mutate a path outside this app's output: ${target}`);
  }
}
async function removeOwned(target) {
  assertOwned(target);
  await fsp.rm(target, { recursive: true, force: true });
}
async function cloneDirectory(source, target) {
  assertOwned(target);
  if (path.resolve(source) === path.resolve(target)) throw new Error('Copy source equals destination');
  await fsp.mkdir(path.dirname(target), { recursive: true });
  try {
    execFileSync('/bin/cp', ['-cRp', source, target], { stdio: 'pipe' });
  } catch {
    await removeOwned(target);
    execFileSync('/usr/bin/ditto', [source, target], { stdio: 'pipe' });
  }
}
async function overlayDirectory(source, target) {
  for (const entry of await fsp.readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    assertOwned(to);
    if (entry.isDirectory()) {
      await fsp.mkdir(to, { recursive: true });
      await overlayDirectory(from, to);
    } else {
      if (entry.isSymbolicLink()) throw new Error(`Overlay symlinks are not allowed: ${from}`);
      await fsp.copyFile(from, to);
      await fsp.chmod(to, (await fsp.stat(from)).mode & 0o777);
    }
  }
}
async function replaceOnce(file, before, after, label) {
  const current = await fsp.readFile(file, 'utf8');
  if (!current.includes(before)) {
    if (current.includes(after)) return;
    throw new Error(`Vendor code changed; cannot apply ${label}`);
  }
  if (current.indexOf(before) !== current.lastIndexOf(before)) {
    throw new Error(`Ambiguous patch target: ${label}`);
  }
  await fsp.writeFile(file, current.replace(before, after));
  edits.push({ file: path.relative(tempTree, file), label });
}
function flattenHeader(node, prefix = '', result = new Map()) {
  for (const [name, entry] of Object.entries(node.files ?? {})) {
    const key = prefix ? `${prefix}/${name}` : name;
    if (entry.files) flattenHeader(entry, key, result);
    else result.set(key, entry);
  }
  return result;
}
function readPlist(file) {
  return JSON.parse(execFileSync('/usr/bin/python3', ['-c',
    'import json,plistlib,sys; print(json.dumps(plistlib.load(open(sys.argv[1],"rb"))))',
    file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
}
function integrityDictionaryDigest(integrity) {
  // Electron's integrity_digest.mm hashes sorted path + algorithm + hash,
  // without JSON, separators or the trailing NUL bytes.
  const hash = crypto.createHash('sha256');
  for (const key of Object.keys(integrity).sort()) {
    const value = integrity[key];
    if (value?.algorithm !== 'SHA256' || !/^[0-9a-f]{64}$/.test(value.hash)) {
      throw new Error(`Unsupported ASAR integrity dictionary entry: ${key}`);
    }
    hash.update(key, 'utf8');
    hash.update(value.algorithm, 'utf8');
    hash.update(value.hash, 'utf8');
  }
  return hash.digest();
}
async function updateFrameworkIntegrityDigest(newIntegrity) {
  const relativeBundle = 'Contents/Frameworks/Codex Framework.framework';
  const relativeBinary = `${relativeBundle}/Versions/Current/Codex Framework`;
  const originalBinary = path.join(originalApp, relativeBinary);
  const targetBinary = await fsp.realpath(path.join(tempApp, relativeBinary));
  assertOwned(targetBinary);
  const bytes = await fsp.readFile(originalBinary);
  if (sha256(bytes) !== sha256(await fsp.readFile(targetBinary))) {
    throw new Error('The cloned Framework differs from the original before integrity metadata patching');
  }
  const originalIntegrity = readPlist(path.join(originalApp, 'Contents/Info.plist')).ElectronAsarIntegrity;
  const originalDigest = integrityDictionaryDigest(originalIntegrity);
  const digest = integrityDictionaryDigest(newIntegrity);
  const sentinel = Buffer.from('AGbevlPCksUGKNL8TSn7wGmJEuJsXb2A', 'ascii');
  const slots = [];
  let searchFrom = 0;
  for (;;) {
    const offset = bytes.indexOf(sentinel, searchFrom);
    if (offset === -1) break;
    const usedOffset = offset + sentinel.length;
    const versionOffset = usedOffset + 1;
    const digestOffset = versionOffset + 1;
    if (digestOffset + 32 > bytes.length || bytes[usedOffset] !== 1 || bytes[versionOffset] !== 1) {
      throw new Error(`Unexpected or disabled Framework integrity slot at ${offset}; refusing to weaken validation`);
    }
    if (!bytes.subarray(digestOffset, digestOffset + 32).equals(originalDigest)) {
      throw new Error(`Original Framework integrity slot does not match the original official Info.plist at ${offset}`);
    }
    slots.push({ sentinelOffset: offset, digestOffset, used: 1, version: 1 });
    searchFrom = digestOffset + 32;
  }
  if (!slots.length) throw new Error('No Electron integrity dictionary digest slot was found in the Framework');
  const handle = await fsp.open(targetBinary, 'r+');
  try {
    for (const slot of slots) {
      const { bytesWritten } = await handle.write(digest, 0, digest.length, slot.digestOffset);
      if (bytesWritten !== digest.length) throw new Error('Incomplete Framework digest metadata write');
      const check = Buffer.alloc(34);
      await handle.read(check, 0, check.length, slot.digestOffset - 2);
      if (check[0] !== 1 || check[1] !== 1 || !check.subarray(2).equals(digest)) {
        throw new Error('Framework integrity slot did not verify after metadata patching');
      }
    }
    await handle.sync();
  } finally {
    await handle.close();
  }
  // All modifications are inside the 32-byte digest slots. The separate fuse
  // wire and integrity slot used/version bytes remain enabled and unchanged.
  const helperDirectory = await fsp.realpath(path.join(tempApp, relativeBundle, 'Versions/Current/Helpers'));
  const helperNames = (await fsp.readdir(helperDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name.endsWith('.app')).map(entry => entry.name).sort();
  if (helperNames.length !== 8) throw new Error(`Vendor helper layout changed: expected 8 apps, found ${helperNames.length}`);
  const helpers = helperNames.map(name => path.join(outputApp, path.relative(tempApp, helperDirectory), name));
  return {
    source: 'https://github.com/electron/electron/blob/main/shell/common/asar/integrity_digest.mm',
    frameworkBinary: path.join(outputApp, path.relative(tempApp, targetBinary)),
    originalDictionarySha256: originalDigest.toString('hex'),
    dictionarySha256: digest.toString('hex'), slots,
    fusesChanged: false,
    signingPlan: {
      helpers, framework: path.join(outputApp, relativeBundle), outerApp: outputApp,
      runtimeExecutable: path.join(outputApp, 'Contents/MacOS/ChatGPT'),
    },
  };
}

await fsp.mkdir(buildRoot, { recursive: true });
await removeOwned(tempTree);
await removeOwned(tempApp);
try {
  console.log('Cloning the project-owned official application and ASAR source.');
  await cloneDirectory(sourceTree, tempTree);
  if (options.overlay) await overlayDirectory(options.overlay, tempTree);
  await cloneDirectory(originalApp, tempApp);

  // Run before any vendor imports. Vendor shell initialization preserves CODEX_HOME
  // when CODEX_ELECTRON_USER_DATA_PATH was explicitly supplied at startup.
  const early = path.join(tempTree, '.vite/build/early-bootstrap.js');
  let earlyCode = await fsp.readFile(early, 'utf8');
  const marker = '/* YINGQING_LOCAL_PROFILE_V1 */';
  if (!earlyCode.startsWith(marker)) {
    const profile = {
      CODEX_HOME: path.join(root, 'state/codex-home'),
      CODEX_ELECTRON_USER_DATA_PATH: path.join(root, 'state/user-data'),
      CODEX_SPARKLE_ENABLED: 'false',
    };
    const prefix = `${marker}\nObject.assign(process.env,${JSON.stringify(profile)});\n`;
    earlyCode = prefix + earlyCode;
    await fsp.writeFile(early, earlyCode);
    edits.push({ file: '.vite/build/early-bootstrap.js', label: 'Independent local profile and supported updater switch' });
  }
  const bootstrap = path.join(tempTree, '.vite/build/bootstrap-DCRTDDSX.js');
  await replaceOnce(bootstrap,
    'enableUpdater:n.i.shouldIncludeUpdater(p,process.platform,process.env)',
    'enableUpdater:!1/* YINGQING_LOCAL_UPDATES_DISABLED */',
    'Disable official updater regardless of shell environment');
  await replaceOnce(bootstrap, 'y.app.setName(i.Wt(cP))',
    `y.app.setName(${JSON.stringify(appName)})`, 'Local macOS application name');
  await replaceOnce(bootstrap,
    'function re(){if(process.platform===`win32`)return;let t=$A(e.isPackaged);',
    'function re(){return;/* YINGQING_NO_OFFICIAL_PROTOCOL_REGISTRATION */let t=$A(e.isPackaged);',
    'Avoid claiming official Codex and web URL protocols');
  // File logs otherwise share the vendor production directory even with userData isolated.
  for (const fileName of ['file-based-logger-DD0smlUs.js', 'worker.js']) {
    const file = path.join(tempTree, '.vite/build', fileName);
    const code = await fsp.readFile(file, 'utf8');
    const from = 'return`com.openai.codex`';
    const to = `return\`${bundleId}\``;
    if (code.includes(from)) {
      await fsp.writeFile(file, code.split(from).join(to));
      edits.push({ file: `.vite/build/${fileName}`, label: 'Independent production log directory' });
    } else if (!code.includes(to)) throw new Error(`Vendor log identifier changed in ${fileName}`);
  }
  for (const fileName of ['early-bootstrap.js', 'bootstrap-DCRTDDSX.js', 'file-based-logger-DD0smlUs.js', 'worker.js']) {
    execFileSync(process.execPath, ['--check', path.join(tempTree, '.vite/build', fileName)], { stdio: 'pipe' });
  }

  const originalFiles = flattenHeader(asar.getRawHeader(originalAsar).header);
  const nativePaths = [...originalFiles].filter(([, value]) => value.unpacked).map(([key]) => key);
  for (const key of nativePaths) {
    const signedNative = await fsp.readFile(path.join(`${originalAsar}.unpacked`, key));
    const stagedNative = await fsp.readFile(path.join(tempTree, key));
    if (sha256(signedNative) !== sha256(stagedNative)) {
      throw new Error(`A signed native sidecar was modified or omitted: ${key}`);
    }
  }
  const resources = path.join(tempApp, 'Contents/Resources');
  const nativeBrandingDir = path.join(root, 'build/native-branding');
  const nativeBranding = JSON.parse(await fsp.readFile(path.join(nativeBrandingDir, 'manifest.json'), 'utf8'));
  const allowedBrandResources = new Map(['chatgptTemplate.png','chatgptTemplate@2x.png','icon-chatgpt.png','icon-codex-dark-color.png','icon-codex-light.png','icon-space-dark.png','icon-space-light.png','icon-chatgpt.icns','electron.icns','app.icns'].map(name=>[name,'Contents/Resources/'+name]));
  const frameworkResourceRoot = 'Contents/Frameworks/Codex Framework.framework/Versions/155.0.8059.80';
  allowedBrandResources.set('alerts-app.icns', `${frameworkResourceRoot}/Helpers/Codex (Alerts).app/Contents/Resources/app.icns`);
  allowedBrandResources.set('aperitif-alerts-app.icns', `${frameworkResourceRoot}/Helpers/Codex (Aperitif Alerts).app/Contents/Resources/app.icns`);
  allowedBrandResources.set('framework-product-logo-32.png', `${frameworkResourceRoot}/Resources/product_logo_32.png`);
  if (nativeBranding.entries.length !== allowedBrandResources.size) throw new Error('Native branding resource count differs');
  for (const entry of nativeBranding.entries) {
    if (allowedBrandResources.get(entry.name) !== entry.target) throw new Error('Unexpected native branding resource: ' + entry.name);
    allowedBrandResources.delete(entry.name);
    const target = path.join(tempApp, entry.target);
    assertOwned(target);
    if (!(await fsp.stat(target)).isFile()) throw new Error('Original native branding resource missing: ' + entry.name);
    const bytes = await fsp.readFile(path.join(nativeBrandingDir, entry.name));
    if (sha256(bytes) !== entry.sha256) throw new Error('Native brand asset hash mismatch: ' + entry.name);
    await fsp.writeFile(target, bytes);
    edits.push({file: entry.target, label: 'Tencent video global native branding'});
  }
  const packedAsar = path.join(resources, 'app.asar');
  await fsp.rm(packedAsar, { force: true });
  await fsp.rm(`${packedAsar}.unpacked`, { recursive: true, force: true });
  const unpack = `{${nativePaths.map(key => path.join(tempTree, key)).join(',')}}`;
  console.log(`Packing ASAR with ${nativePaths.length} unchanged native sidecars.`);
  await asar.createPackageWithOptions(tempTree, packedAsar, { unpack });
  const packedHeader = asar.getRawHeader(packedAsar);
  const packedFiles = flattenHeader(packedHeader.header);
  const packedNative = [...packedFiles].filter(([, value]) => value.unpacked).map(([key]) => key).sort();
  if (JSON.stringify([...nativePaths].sort()) !== JSON.stringify(packedNative)) {
    throw new Error('The output ASAR unpacked entries differ from the signed vendor sidecars');
  }
  for (const key of nativePaths) {
    if (sha256(await fsp.readFile(path.join(`${packedAsar}.unpacked`, key))) !==
        sha256(await fsp.readFile(path.join(`${originalAsar}.unpacked`, key)))) {
      throw new Error(`Native sidecar differs after packaging: ${key}`);
    }
  }
  const headerHash = sha256(packedHeader.headerString);
  await fsp.copyFile(launcherIcon, path.join(resources, 'yingqing.icns'));
  const plist = path.join(tempApp, 'Contents/Info.plist');
  const plistEdits = {
    CFBundleDisplayName: displayName,
    CFBundleName: appName,
    CFBundleIdentifier: bundleId,
    CFBundleURLTypes: [{ CFBundleURLName: bundleId, CFBundleURLSchemes: ['yingqing'] }],
    ElectronAsarIntegrity: { 'Resources/app.asar': { algorithm: 'SHA256', hash: headerHash } },
    SUEnableAutomaticChecks: false,
    SUAutomaticallyUpdate: false,
    CFBundleIconFile: 'yingqing.icns',
  };
  execFileSync('/usr/bin/python3', ['-c',
    'import json,plistlib,sys; p=sys.argv[1]; d=plistlib.load(open(p,"rb")); d.update(json.loads(sys.argv[2])); d.pop("CFBundleIconName",None); plistlib.dump(d,open(p,"wb"),fmt=plistlib.FMT_BINARY)',
    plist, JSON.stringify(plistEdits)], { stdio: 'pipe' });
  const nativeEntry = await buildNativeEntry(root, tempApp);
  edits.push({file: nativeEntry.launcherRelativePath, label: 'Single native application entry with explicit local profile'});
  const nativeVisibleResources = await applyNativeVisibleResources(tempApp);
  for (const entry of nativeVisibleResources) edits.push({file:entry.file,label:'Yao native visible branding',kind:entry.kind});
  const frameworkIntegrity = await updateFrameworkIntegrityDigest(plistEdits.ElectronAsarIntegrity);

  await removeOwned(stagedTree);
  await fsp.rename(tempTree, stagedTree);
  await removeOwned(outputApp);
  await fsp.rename(tempApp, outputApp);
  for (const name of ['codex-home', 'user-data']) {
    await fsp.mkdir(path.join(root, 'state', name), { recursive: true, mode: 0o700 });
  }
  const manifest = {
    packagedAt: new Date().toISOString(), originalApp, sourceTree,
    overlay: options.overlay ?? null, outputApp, bundleId, displayName,
    asarHeaderSha256: headerHash,
    asarSha256: sha256(await fsp.readFile(path.join(outputApp, 'Contents/Resources/app.asar'))),
    originalAsarSha256: sha256(await fsp.readFile(originalAsar)),
    fileCount: packedFiles.size, nativeSidecars: nativePaths,
    frameworkIntegrity,
    nativeBranding, nativeVisibleResources, nativeEntry,
    launcherIcon: {source: launcherIcon, target: 'Contents/Resources/yingqing.icns', sha256: sha256(await fsp.readFile(launcherIcon))},
    edits, signed: false, launched: false,
    note: 'Project-owned derivative. Modified Framework and outer app require local signing; its 8 helpers also require local signatures permitting the local Framework. Original installed apps are untouched.',
  };
  await fsp.writeFile(path.join(buildRoot, 'package-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Packaged: ${outputApp}`);
  console.log(`ASAR header SHA256: ${headerHash}`);
  console.log(`Framework integrity dictionary SHA256: ${frameworkIntegrity.dictionarySha256}`);
  console.log(`Signing plan: ${path.join(root, 'scripts/sign-app.py')}`);
  console.log('Local signing is required before launch; no application has been started.');
} catch (error) {
  await removeOwned(tempTree);
  await removeOwned(tempApp);
  throw error;
}
