#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Only creates the small native entry inside a project-owned application bundle.
// The Electron executable, ASAR, framework and user state remain untouched.
export async function buildNativeEntry(root, targetApp) {
  root = await fs.realpath(root);
  targetApp = await fs.realpath(targetApp);
  const ownedAppDirectory = path.join(root, 'app');
  if (path.dirname(targetApp) !== ownedAppDirectory || !targetApp.endsWith('.app')) {
    throw Error('Native entry target must be a bundle inside this project\'s app directory');
  }
  const source = path.join(root, 'scripts/native-entry.c');
  const launcherRelativePath = 'Contents/MacOS/YaoLauncher';
  const runtimeExecutableRelativePath = 'Contents/MacOS/ChatGPT';
  const runtime = path.join(targetApp, runtimeExecutableRelativePath);
  if (!(await fs.stat(runtime)).isFile()) throw Error('Original Electron executable is missing');
  execFileSync('/usr/bin/clang', [
    '-std=c11', '-O2', '-Wall', '-Wextra', '-Werror', source,
    '-o', path.join(targetApp, launcherRelativePath),
  ], {stdio: 'pipe'});
  await fs.chmod(path.join(targetApp, launcherRelativePath), 0o755);
  execFileSync('/usr/bin/python3', ['-c',
    'import plistlib,sys; p=sys.argv[1]; d=plistlib.load(open(p,"rb")); d["CFBundleExecutable"]="YaoLauncher"; e=d.get("LSEnvironment",{}); e.pop("CODEX_HOME",None); e.pop("CODEX_ELECTRON_USER_DATA_PATH",None); d.pop("LSEnvironment",None) if not e else None; plistlib.dump(d,open(p,"wb"),fmt=plistlib.FMT_BINARY)',
    path.join(targetApp, 'Contents/Info.plist')], {stdio: 'pipe'});
  return {
    source, launcherRelativePath, runtimeExecutableRelativePath,
    preservesOriginalArguments: true,
    defaultUserDataArgument: '--user-data-dir=<project>/state/user-data',
    profileEnvironment: ['CODEX_HOME', 'CODEX_ELECTRON_USER_DATA_PATH'],
  };
}
