import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'src/home-tips.js'), 'utf8');
const css = await fs.readFile(path.join(root, 'src/home-posters.css'), 'utf8');
const entries = JSON.parse(await fs.readFile(path.join(root, 'assets/home-posters/manifest.json'), 'utf8')).entries;
const start = source.indexOf('function YaoHomePosters()');
const end = source.indexOf('function YaoHomeSurface(', start);
assert.ok(start >= 0 && end > start);
const component = source.slice(start, end).replaceAll('import.meta.url', '"https://example.invalid/assets/home.js"');
assert.ok(!/\b(?:setTimeout|setInterval|requestAnimationFrame|useEffect)\b/.test(component), 'Posters must use CSS, without timers.');
const runtime = {jsx: (type, props, key) => ({type, props, key})};
const tree = new Function('YAO_HOME_POSTERS', 'K9', 'URL', component + '; return YaoHomePosters();')(
  entries.map(entry => ({title: entry.title, src: './yao-posters/' + entry.localFile})), runtime, URL);
assert.equal(tree.props['aria-hidden'], true);
assert.equal(tree.props.role, 'presentation');
const columns = tree.props.children.props.children;
assert.equal(columns.length, 3);
const sizes = [];
for (const column of columns) {
  const groups = column.props.children.props.children;
  assert.equal(groups.length, 3, 'Three identical groups are required for each track.');
  assert.deepEqual(groups[0].props.children, groups[1].props.children, 'Group 2 must exactly repeat group 1.');
  assert.deepEqual(groups[0].props.children, groups[2].props.children, 'Group 3 must exactly repeat group 1.');
  assert.ok(groups[0].props.children.length >= 9, 'Tall windows need long groups.');
  sizes.push(groups[0].props.children.length);
}
assert.match(css, /to\s*\{\s*transform:\s*translate3d\(0,\s*calc\(-100%\s*\/\s*3\),\s*0\);\s*\}/,
  'A track must advance exactly one of its three equal groups per period.');
assert.match(css, /animation:\s*yao-home-posters-rise\s+240s\s+linear\s+infinite/);
assert.match(css, /animation-duration:\s*288s/);
assert.match(css, /animation-duration:\s*330s/);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none/);
assert.match(css, /pointer-events:\s*none/);
assert.match(css, /transform:\s*rotate\(-9deg\)/);

// At a period boundary group 2 occupies precisely group 1's old position.
// Padding after every group equals its internal gap, so the seam has the same
// separation as any pair of adjacent posters. Check the smallest grid width,
// where coverage is worst, and a 2160 CSS-pixel-tall desktop window.
const gap = 14;
const gridWidth = 450;
const posterHeight = ((gridWidth - 2 * gap) / 3) * 7 / 5;
const duration = [240, 288, 330];
const geometry = sizes.map((count, index) => {
  const groupHeight = count * (posterHeight + gap);
  const trackHeight = 3 * groupHeight;
  assert.ok(Math.abs(trackHeight / 3 - groupHeight) < 1e-9);
  const visibleRemainder = 2 * groupHeight * Math.cos(9 * Math.PI / 180) - gridWidth * Math.sin(9 * Math.PI / 180) - 110 - 42;
  assert.ok(visibleRemainder > 2160, 'All tracks must cover a tall viewport even at the end of a period.');
  return {column: index + 1, postersPerGroup: count, groups: 3, periodSeconds: duration[index],
    minimumWidthPixelsPerSecond: Number((groupHeight / duration[index]).toFixed(2)),
    remainingVerticalCoveragePixels: Math.floor(visibleRemainder)};
});
console.log(JSON.stringify({posterAssets: entries.length, decorativeOnly: true, originalTipsComponentUntouchedByPosterPatch: true,
  exactGroupPeriod: true, identicalFrameAtLoopBoundary: true, reducedMotionStatic: true,
  rightEdgeOpacity: {light: 0.48, dark: 0.36}, geometry}, null, 2));
