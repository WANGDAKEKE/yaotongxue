import fs from 'node:fs/promises';
import {loadSharp} from './paths.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';

// Rasterize the existing vector mark for app-owned macOS image resources.
// Native code, the official app and signed plugin distributions are untouched.
export async function buildNativeBranding(root) {
  const require = createRequire(import.meta.url);
  const sharp = loadSharp();
  const output = path.join(root, 'build/native-branding');
  await fs.rm(output, {recursive: true, force: true});
  await fs.mkdir(output, {recursive: true});
  const mark = await fs.readFile(path.join(root, 'assets/yingqing-mark.svg'), 'utf8');
  const paths = [...mark.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\bfill="([^"]+)"[^>]*\/?\s*>/g)];
  const core = paths.find(match => match[2] === 'white');
  if (paths.length !== 4 || !core) throw new Error('Canonical Tencent video vector changed');
  const silhouette = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs><mask id="play"><rect width="32" height="32" fill="white"/><path d="${core[1]}" fill="black"/></mask></defs><g mask="url(#play)">${paths.filter(match => match !== core).map(match => `<path d="${match[1]}" fill="black"/>`).join('')}</g></svg>`;
  const canonicalIcon = await fs.readFile(path.join(root, 'assets/yingqing-icon.svg.png'));
  const definitions = [
    ['chatgptTemplate.png', 18, 'template'], ['chatgptTemplate@2x.png', 36, 'template'],
    ['icon-chatgpt.png', 2048, 'color'],
    ['icon-codex-dark-color.png', 1024, 'color'], ['icon-codex-light.png', 1024, 'color'],
    ['icon-space-dark.png', 1024, 'color'], ['icon-space-light.png', 1024, 'color'],
  ];
  const entries = [];
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  for (const [name, size, kind] of definitions) {
    const bytes = await sharp(kind === 'template' ? Buffer.from(silhouette) : canonicalIcon, {density: 300})
      .resize(size, size).png().toBuffer();
    const metadata = await sharp(bytes).metadata();
    if (metadata.width !== size || metadata.height !== size || !metadata.hasAlpha) throw new Error('Native brand icon metadata invalid: ' + name);
    await fs.writeFile(path.join(output, name), bytes);
    entries.push({name, target: 'Contents/Resources/' + name, kind, width: size, height: size, sha256: digest(bytes)});
  }
  const icns = await fs.readFile(path.join(root, 'assets/yingqing.icns'));
  for (const name of ['icon-chatgpt.icns', 'electron.icns', 'app.icns']) {
    await fs.writeFile(path.join(output, name), icns);
    entries.push({name, target: 'Contents/Resources/' + name, kind: 'icns', sha256: digest(icns)});
  }
  const framework = 'Contents/Frameworks/Codex Framework.framework/Versions/155.0.8059.80';
  for (const [name, helper] of [['alerts-app.icns', 'Codex (Alerts).app'], ['aperitif-alerts-app.icns', 'Codex (Aperitif Alerts).app']]) {
    await fs.writeFile(path.join(output, name), icns);
    entries.push({name, target: `${framework}/Helpers/${helper}/Contents/Resources/app.icns`, kind: 'icns', sha256: digest(icns)});
  }
  const product = await sharp(Buffer.from(mark)).resize(32, 32).png().toBuffer();
  await fs.writeFile(path.join(output, 'framework-product-logo-32.png'), product);
  entries.push({name: 'framework-product-logo-32.png', target: `${framework}/Resources/product_logo_32.png`, kind: 'color', width: 32, height: 32, sha256: digest(product)});
  const manifest = {builtAt: new Date().toISOString(), entries, nativeCodeModified: false};
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
