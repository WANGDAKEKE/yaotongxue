#!/usr/bin/env node
// The macOS entry icon is independent of all in-app branding assets.
import fs from 'node:fs/promises';
import {loadSharp} from './paths.mjs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = loadSharp();
const svg = await fs.readFile(path.join(root, 'assets/launcher-icon.svg'));
const iconset = path.join(root, 'build/launcher.iconset');
await fs.mkdir(iconset, {recursive: true});
await sharp(svg).png().toFile(path.join(root, 'assets/launcher-icon.png'));
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    const name = `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`;
    await sharp(svg).resize(size * scale).png().toFile(path.join(iconset, name));
  }
}
execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', path.join(root, 'assets/launcher-icon.icns')]);
console.log('Built independent macOS entry icon. In-app assets unchanged.');
