import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const vendorRoot = process.env.YAOTONGXUE_VENDOR_ROOT
  ? path.resolve(process.env.YAOTONGXUE_VENDOR_ROOT)
  : path.resolve(projectRoot, '../official-desktop');
export const vendorPath = (...parts) => path.join(vendorRoot, ...parts);
const require = createRequire(import.meta.url);

export function loadSharp() {
  try {
    return require(vendorPath('app/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/sharp'));
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return require('sharp');
  }
}

export async function loadAsar() {
  const toolRoot = process.env.YAOTONGXUE_TOOLING_ROOT
    ? path.resolve(process.env.YAOTONGXUE_TOOLING_ROOT)
    : path.resolve(projectRoot, '../tooling');
  const localModule = path.join(toolRoot, 'asar/node_modules/@electron/asar/lib/asar.js');
  try {
    return await import(pathToFileURL(localModule).href);
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    return import('@electron/asar');
  }
}
