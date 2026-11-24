import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {projectRoot} from './paths.mjs';

let checked = 0;
for (const directory of ['src', 'scripts']) {
  for (const entry of await fs.readdir(path.join(projectRoot, directory), {withFileTypes: true})) {
    if (!entry.isFile()) continue;
    const filename = path.join(projectRoot, directory, entry.name);
    if (entry.name.endsWith('.json')) {
      JSON.parse(await fs.readFile(filename, 'utf8'));
      checked++;
    } else if (/\.(?:mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', filename], {encoding: 'utf8'});
      if (result.status !== 0) throw new Error(`${directory}/${entry.name}: ${result.stderr}`);
      checked++;
    }
  }
}
console.log(`Source syntax and JSON checked: ${checked} files.`);
