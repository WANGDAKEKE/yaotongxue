import assert from 'node:assert/strict';
import {vendorPath} from './paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {applyHomeExtension, homeSourceFiles, homeContextCopy} from './home-extension.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = vendorPath('extracted-app/webview/assets');
const tips = JSON.parse(await fs.readFile(path.join(root, 'src/home-tips.json'), 'utf8'));
const posters = [{title: '验证海报', src: './yao-posters/fixture.webp'}];
const runtime = await fs.readFile(path.join(root, 'src/home-tips.js'), 'utf8');
const checks = [];
const check = (name, run) => { run(); checks.push(name); };
const options = {tips, posters};
const source = await fs.readFile(path.join(vendor, homeSourceFiles[0]), 'utf8');
const output = applyHomeExtension(homeSourceFiles[0], source, options);

check('Exactly one ordinary-home host is extended; unrelated chunks are unchanged', () => {
  assert.equal(output.split('(0,K9.jsx)(YaoHomeSurface,').length - 1, 1);
  assert.equal(source.split('children:e=>(0,K9.jsx)(`div`,{"data-lighthouse-navigation":').length - 1, 1);
  assert(output.includes('Ui=!Te&&!dn&&!Se?'));
  assert.equal(applyHomeExtension('onboarding-page-15d0879c5b68.js', 'unchanged', options), 'unchanged');
  assert.equal(applyHomeExtension('conversation-ui-70ad26f589fe.js', 'unchanged', options), 'unchanged');
});

const chinese = applyHomeExtension(homeSourceFiles[1], await fs.readFile(path.join(vendor, homeSourceFiles[1]), 'utf8'), options);
check('All four actual home messages and their Chinese paths are adapted', () => {
  for (const value of Object.values(homeContextCopy)) {
    assert(output.includes('defaultMessage:`' + value + '`'));
    assert(chinese.includes('`' + value + '`'));
  }
});

check('Original project selector and editor callbacks stay exact', () => {
  const original = output.split('\n// YAO_HOME_EXTENSION\n')[0];
  let normalized = original
    .replace('children:e=>(0,K9.jsx)(YaoHomeSurface,{"data-lighthouse-navigation":', 'children:e=>(0,K9.jsx)(`div`,{"data-lighthouse-navigation":')
    .replace('className:`group/title inline-block max-w-full`,children:(0,H9.jsx)(YaoHomeTips,{context:m})', 'className:`group/title inline-block max-w-full`,children:m')
    .replace('"data-home-ambient-suggestions":!0,"data-yao-home-suggestions":"",layout:', '"data-home-ambient-suggestions":!0,layout:')
    .replace('composer:_n?(0,K9.jsxs)(`div`,{"data-yao-home-composer":"",className:', 'composer:_n?(0,K9.jsxs)(`div`,{className:');
  for (const id of Object.keys(homeContextCopy)) {
    const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp('(id:`' + escapeRE(id) + '`,defaultMessage:)`(?:\\\\.|[^`])*`');
    const baseline = source.match(pattern)?.[0];
    assert(baseline, id);
    normalized = normalized.replace(pattern, baseline);
  }
  assert.equal(normalized, source);
});

const syntaxDir = path.join(root, 'build/home-extension-check');
await fs.mkdir(syntaxDir, {recursive: true});
const fixturePath = path.join(syntaxDir, 'app-primary.mjs');
await fs.writeFile(fixturePath, output);
check('Generated official source parses as a JavaScript module', () => {
  const result = spawnSync(process.execPath, ['--check', fixturePath], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
});

function harness({reduced = false, focused = false, hidden = false} = {}) {
  const states = [];
  const intervals = new Map();
  const timeouts = new Map();
  const listeners = new Map();
  let stateSlot = 0;
  let cleanup;
  let effect;
  let nextTimer = 1;
  const homeRoot = {contains: () => true};
  const activeElement = focused ? {matches: () => true} : null;
  const media = {matches: reduced, addEventListener: (type, handler) => listeners.set(type, handler), removeEventListener: type => listeners.delete(type)};
  const jsx = (type, props, key) => ({type, props, key});
  const sandbox = {
    URL,
    YAO_HOME_TIPS: tips,
    YAO_HOME_POSTERS: posters,
    H9: {jsx, jsxs: jsx},
    K9: {jsx, jsxs: jsx},
    L9: {
      useState: initial => {
        const slot = stateSlot++;
        if (!(slot in states)) states[slot] = initial;
        return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }];
      },
      useRef: () => ({current: {closest: () => homeRoot}}),
      useEffect: callback => { effect ??= callback; },
    },
    document: {activeElement, hidden},
    matchMedia: () => media,
    setInterval: (handler, delay) => { const id = nextTimer++; intervals.set(id, {handler, delay}); return id; },
    clearInterval: id => intervals.delete(id),
    setTimeout: (handler, delay) => { const id = nextTimer++; timeouts.set(id, {handler, delay}); return id; },
    clearTimeout: id => timeouts.delete(id),
  };
  vm.createContext(sandbox);
  vm.runInContext(runtime.replace('import.meta.url', '"file:///ui/assets/app-primary.js"') + '\nthis.yao={YaoHomeTips,YaoHomeSurface,YaoHomePosters};', sandbox);
  const render = context => { stateSlot = 0; return sandbox.yao.YaoHomeTips({context}); };
  const mount = () => { render('context'); cleanup = effect(); };
  const tick = () => { for (const timer of [...intervals.values()]) timer.handler(); };
  const reveal = () => { const pending = [...timeouts.values()]; timeouts.clear(); for (const timer of pending) timer.handler(); };
  return {sandbox, states, intervals, timeouts, media, listeners, render, mount, tick, reveal, unmount: () => cleanup?.()};
}

check('Tips rotate after three seconds with a separate short transition', () => {
  const h = harness();
  h.mount();
  assert.equal([...h.intervals.values()][0].delay, 3000);
  h.tick();
  assert.equal(h.states[1], 'out');
  assert.equal([...h.timeouts.values()][0].delay, 220);
  h.reveal();
  assert.equal(h.states[0], 1);
  assert.equal(h.states[1], 'in');
  assert.equal(h.render('context').props.children[2].props.children, 'context');
  h.unmount();
  assert.equal(h.intervals.size + h.timeouts.size + h.listeners.size, 0);
});

check('Focused editor and hidden window pause automatic changes', () => {
  for (const options of [{focused: true}, {hidden: true}]) {
    const h = harness(options);
    h.mount(); h.tick();
    assert.equal(h.states[0], 0);
    assert.equal(h.timeouts.size, 0);
    h.unmount();
  }
});

check('Reduced motion stays static, including a live preference change', () => {
  const reduced = harness({reduced: true});
  reduced.mount();
  assert.equal(reduced.intervals.size, 0);
  reduced.unmount();
  const h = harness();
  h.mount(); h.tick();
  assert.equal(h.timeouts.size, 1);
  h.media.matches = true;
  h.listeners.get('change')();
  assert.equal(h.intervals.size + h.timeouts.size, 0);
  assert.equal(h.states[1], 'in');
  h.unmount();
});

check('Home surface passes original props and children after a decorative first child', () => {
  const h = harness();
  const onClick = () => {};
  const ref = {current: null};
  const child = {original: true};
  const root = h.sandbox.yao.YaoHomeSurface({className: 'original class', ref, onClick, children: child});
  assert.equal(root.type, 'div');
  assert.equal(root.props.className, 'original class');
  assert.equal(root.props.ref, ref);
  assert.equal(root.props.onClick, onClick);
  assert.equal(root.props['data-yao-home'], '');
  assert.equal(root.props.children[1], child);
  const background = h.sandbox.yao.YaoHomePosters();
  assert.equal(background.props['aria-hidden'], true);
  assert.equal(background.props.role, 'presentation');
  // The decorative wall can use columns/tracks/repeated groups without changing
  // its contract. Inspect every image rather than relying on a fixed DOM depth.
  const images = [];
  function walk(node) {
    if (Array.isArray(node)) { for (const child of node) walk(child); return; }
    if (node == null || typeof node !== 'object') return;
    if (node.type === 'img') images.push(node);
    walk(node.props?.children);
  }
  walk(background);
  assert(images.length > 0, 'Decorative wall contains no poster images');
  for (const image of images) {
    assert.equal(image.props.src, 'file:///ui/assets/yao-posters/fixture.webp');
    assert.equal(image.props.alt, '');
    assert.equal(image.props.draggable, false);
  }
});

check('Tips remain relevant, positive, and short enough for two-line reading', () => {
  assert.equal(tips.length, new Set(tips).size);
  assert(tips.every(tip => tip.length <= 32 && !tip.includes('先导片')));
});

const report = {checkedAt: new Date().toISOString(), nativeUiInspected: false, checks, passed: checks.length};
await fs.writeFile(path.join(root, 'build/home-extension-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Home extension:', checks.length, 'checks passed.');
for (const name of checks) console.log('✓', name);
