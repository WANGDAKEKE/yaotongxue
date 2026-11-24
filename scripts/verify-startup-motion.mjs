import assert from 'node:assert/strict';
import {vendorPath} from './paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyStartupMotion, applyStartupHtmlMotion, startupMotionDesign} from './startup-motion.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = vendorPath('extracted-app/webview');
const name = 'onboarding-page-15d0879c5b68.js';
const original = await fs.readFile(path.join(vendor, 'assets', name), 'utf8');
const adapted = applyStartupMotion(name, original);
const marker = ',"data-yao-startup":r&&f&&!d?"intro":void 0';
assert.equal(adapted.replace(marker, ''), original, 'Only the activation marker may change.');
assert.equal(applyStartupMotion('unrelated.js', original), original, 'Non-startup components must be untouched.');
assert.throws(() => applyStartupMotion(name, adapted), /already applied/);
assert.throws(() => applyStartupMotion(name, original.replace('onAnimationComplete:T', 'onAnimationComplete:unknown')), /checkpoint changed/);

const condition = adapted.match(/"data-yao-startup":(.*?)\?"intro":void 0/)?.[1];
assert.ok(condition, 'Activation condition must be present.');
const evaluate = new Function('r', 'f', 'd', 'return !!(' + condition + ')');
let gateCases = 0;
for (const splash of [false, true]) for (const focused of [false, true]) for (const reduced of [false, true]) {
  assert.equal(evaluate(splash, focused, reduced), splash && focused && !reduced,
    'Require startup, original focus readiness and original full-motion preference.');
  gateCases++;
}

const html = await fs.readFile(path.join(vendor, 'index.html'), 'utf8');
const link = '<link rel="stylesheet" href="./assets/yao-brand-motion.css">';
assert.equal(applyStartupHtmlMotion(html).replace(link, ''), html, 'HTML helper may only add a stylesheet link.');

const css = await fs.readFile(path.join(root, 'src/brand-motion.css'), 'utf8');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'), 'Respect the system reduced-motion preference too.');
assert.ok(css.includes('[data-yao-startup="intro"] > img'), 'Brand reveal must be scoped to startup.');
assert.ok(!/(?:setTimeout|addEventListener|onAnimationEnd|onAnimationComplete:)/.test(css), 'CSS must not trigger work or progression.');
assert.ok(!/\binfinite\b/.test(css), 'The brand reveal must not loop.');

console.log(JSON.stringify({
  exactMarkerOnly: true,
  originalControllerAndCallbacksUnchanged: true,
  focusAndReducedMotionCasesPassed: gateCases,
  unrelatedComponentsUnchanged: true,
  htmlStylesheetLinkOnly: true,
  cssSystemReducedMotionRetained: true,
  ...startupMotionDesign,
}, null, 2));
