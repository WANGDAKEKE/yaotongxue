import assert from 'node:assert/strict';
import {vendorPath} from './paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {extendOnboarding} from './onboarding-extension.mjs';
import {applyHardcodedBrandCopy} from './brand-hardcoded-copy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = 'tasks-4aa0b66fb4ee.js';
const baseline = await fs.readFile(vendorPath('extracted-app/webview/assets', name), 'utf8');
// Allow exactly the audited display-name literals; native control flow remains
// a byte comparison after localized message text is normalized.
const expected = applyHardcodedBrandCopy(name, baseline).source;
const sourceOnly = process.argv.includes('--source');
const chunk = sourceOnly ? extendOnboarding(name, expected, {}) : await fs.readFile(path.join(root, 'build/ui-overlay/webview/assets', name), 'utf8');
const checks = [];
const verify = async (name, run) => { await run(); checks.push(name); };
const plain = value => JSON.parse(JSON.stringify(value));
const normalizeMessages = source => source.replace(/defaultMessage:`(?:\\.|[^`])*`/g, 'defaultMessage:`CONTENT`');

function extract(source, name, next) {
  const marker = 'function ' + name + '(';
  let start = source.indexOf(marker);
  assert(start >= 0, 'Missing function ' + name);
  assert.equal(source.indexOf(marker, start + marker.length), -1, 'Ambiguous function ' + name);
  if (source.slice(start - 6, start) === 'async ') start -= 6;
  let end = source.indexOf(next, start + marker.length);
  assert(end > start, 'Missing boundary ' + next);
  if (next.startsWith('function ') && source.slice(end - 6, end) === 'async ') end -= 6;
  return source.slice(start, end).trim();
}
const boundaries = {
  fu: 'function pu(', _u: 'function vu(', vu: 'function yu(', yu: 'function bu(', bu: 'function xu(',
  po: 'function mo(', mo: 'function ho(', ho: 'var go,_o', yo: 'function bo(', bo: 'function xo(', Co: 'var wo,To',
  Fc: 'function Ic(', Rc: 'function zc(', Uc: 'function Wc(', Wc: 'function Gc(', Gc: 'function Kc(',
  lc: 'function uc(', vc: 'function yc(', yc: 'function bc(', bc: 'var xc,', pc: 'function mc(',
};
const functions = Object.fromEntries(Object.entries(boundaries).map(([name, next]) => [name, extract(chunk, name, next)]));

await verify('All native task handlers, permissions, attempts and guards retain the official code', () => {
  for (const [name, next] of Object.entries(boundaries)) {
    if (name === 'fu' || name === '_u') continue;
    assert.equal(normalizeMessages(functions[name]), normalizeMessages(extract(expected, name, next)), name + ': native execution changed');
    if (name !== 'pc') new vm.Script('(' + functions[name] + ')', {filename: 'native:' + name});
  }
  const getter = source => source.slice(source.indexOf('Iu=o(q,'), source.indexOf(',Lu=o', source.indexOf('Iu=o(q,')));
  assert.equal(getter(chunk), getter(expected), 'Original visible-task getter changed');
});

await verify('Prompt-only handlers and per-role injected catalogs are absent', () => {
  assert(!chunk.includes('YaoRoleTaskEntry'));
  assert(!chunk.includes('YAO_ROLE_TASK_CATALOG'));
  assert(!chunk.includes('YaoRoleTaskPrepare'));
});

const atoms = ['si','_o','Ye','uo','co','J','Xc','Zc','Qc','$c','el','tl','Ec','Dc','Tc'];
const nativeNote = {native: 'desktop_note'};
const nativeChart = {native: 'csv_chart'};
const calls = {permission: [], note: [], html: [], png: [], dispatch: []};
let noteDeferred = null;
let chartDeferred = null;
const deferred = () => { let resolve; const promise = new Promise(done => {resolve = done;}); return {promise, resolve}; };
const context = vm.createContext({
  AbortController, Map, Set, WeakMap, Object, Array, String, Promise, TextEncoder,
  ...Object.fromEntries(atoms.map(atom => [atom, atom])),
  go: new WeakMap(), on: '姚同学',
  Be: deferred,
  Fi: {tasks: {}}, oi: ['unrelated_plugin'], Du: 8, Eu: 2,
  ku: {desktop_note: nativeNote, csv_chart: nativeChart},
  Au: {desktop_note: nativeNote, csv_chart: nativeChart},
  Yr: {safeParse: value => ({success: ['desktop_note', 'csv_chart'].includes(value), data: value})},
  Xn: () => null,
  li: () => {throw new Error('Unexpected plugin filter');},
  Jl: () => {throw new Error('Unexpected plugin execution');},
  es: () => {throw new Error('Unexpected computer-use task');},
  wu: {default: () => {throw new Error('Task order must remain stable');}},
  di: scope => scope.get('si'),
  ri: (scope, id) => scope.get('si').selectedTask === id,
  ei: (scope, status) => scope.set('si', {...scope.get('si'), permissionStatus: status}),
  mi: scope => scope.set('si', {...scope.get('si'), phase: 'execution'}),
  ur: (scope, id) => calls.dispatch.push(id),
  or() {}, cr() {}, er() {}, dr() {}, lr() {}, ir() {}, Qn() {},
  U: {error() {}},
  xe: {conversationalOnboarding: {
    async requestDesktopRoot() {calls.permission.push('Desktop'); return '/fixture/Desktop';},
    async createDesktopNote(options) {calls.note.push(options); return noteDeferred ? noteDeferred.promise : {path: '/fixture/Desktop/story.txt'};},
    async createSampleChart(options) {calls.html.push(options); return chartDeferred ? chartDeferred.promise : {path: '/fixture/outputs/review.html'};},
  }},
  mc: async projectRoot => projectRoot,
  Vs: () => ({fragment: '<main><h1>Video review fixture</h1></main>', title: 'Video review fixture'}),
  O: async () => ({getStandaloneVisualizationHtml: (fragment, {title}) => '<!doctype html><title>' + title + '</title>' + fragment}),
  __vite__mapDeps: () => [],
  fc: async () => {calls.png.push(true); throw new Error('HTML demo entered PNG handler');},
  dc: function Icon() {}, uc: function Attachment() {}, Oc: {defaultMessage: 'Demo'},
});
// The importer callback is never invoked: O supplies the standalone HTML helper.
// import.meta.url alone needs a literal replacement to parse in this isolated VM.
vm.runInContext(Object.values(functions).join('\n').replaceAll('import.meta.url', '"file:///fixture/assets/tasks.js"'), context, {filename: 'native-demo-harness', timeout: 1000});

function scopeFor(task) {
  const values = new Map([
    ['si', {selectedRole: 'engineering', selectedTask: task, phase: 'task', permissionStatus: 'not-requested'}],
    ['_o', 'pending'], ['uo', false], ['co', false], ['J', false],
    ['Xc', null], ['Zc', 'writing'], ['Qc', undefined], ['$c', false], ['el', false], ['tl', false],
    ['Ec', true], ['Dc', 'minimum-generation-elapsed'], ['Tc', null],
    ['Ye', {formatMessage: ({defaultMessage}, values = {}) => defaultMessage.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '{' + key + '}')}],
  ]);
  return {node: {}, get: key => values.get(key), set: (key, value) => values.set(key, typeof value === 'function' ? value(values.get(key)) : value)};
}
async function settled(attempt) {
  let timeout;
  try { return await Promise.race([attempt.result, new Promise((_, reject) => {timeout = setTimeout(() => reject(new Error('Native attempt failed to settle')), 1000);})]); }
  finally {clearTimeout(timeout);}
}

await verify('Every role and backend assignment produce the same ordered native tasks', () => {
  const roles = ['engineering','product_management','finance','marketing','sales','operations','people_hr','legal','data_science','design','student','something_else','default',null];
  for (const role of roles) {
    const assigned = context.fu(role);
    assert.deepEqual(plain(assigned.task_ids), ['desktop_note', 'csv_chart']);
    for (const ids of [assigned.task_ids, ['unrelated_plugin'], []]) {
      const {catalog} = context._u({computerUseAvailable: false, platform: 'macOS', config: {tasks: {}}, taskIds: ids, locale: 'zh-CN', mailProvider: null, plan: null, randomizeOrder: true});
      assert.deepEqual(plain(catalog.visibleTaskIds), ['desktop_note', 'csv_chart']);
      assert.equal(catalog.entries.get('desktop_note'), nativeNote);
      assert.equal(catalog.entries.get('csv_chart'), nativeChart);
      assert.equal(catalog.pluginIds.size + catalog.pluginNames.size, 0);
    }
  }
});

await verify('Desktop note waits for permission, writes via the real handler, and leaves animation completion to the UI', async () => {
  const scope = scopeFor('desktop_note');
  const attempt = context.Fc(scope, context.Co(scope, 'desktop_note'));
  await attempt.started;
  assert.equal(calls.permission.length + calls.note.length, 0);
  assert.equal(attempt.settled, false);
  await context.Uc(scope);
  const outcome = await settled(attempt);
  assert.equal(outcome.status, 'completed');
  assert.equal(outcome.output, '/fixture/Desktop/story.txt');
  assert.equal(calls.permission.length, 1);
  assert.equal(calls.note[0].parentPath, '/fixture/Desktop');
  assert.equal(typeof calls.note[0].content, 'string');
  assert.equal(scope.get('Xc'), outcome.output);
  assert.equal(scope.get('si').permissionStatus, 'allowed');
  assert.equal(scope.get('si').phase, 'execution');
  assert.equal(scope.get('uo'), true);
  assert.equal(scope.get('co'), false, 'Completion must wait for the original UI phase');
  context.Gc(scope);
  assert.equal(scope.get('Xc'), null);
});

await verify('Canceled permission attempt cannot start file execution', async () => {
  const scope = scopeFor('desktop_note');
  const attempt = context.Fc(scope, context.Co(scope, 'desktop_note'));
  await attempt.started;
  attempt.cancel();
  assert.equal((await settled(attempt)).status, 'interrupted');
  const before = calls.permission.length + calls.note.length;
  await context.Uc(scope);
  assert.equal(calls.permission.length + calls.note.length, before);
});

await verify('Canceled native note completion cannot publish a stale result', async () => {
  const scope = scopeFor('desktop_note');
  const attempt = context.Fc(scope, context.Co(scope, 'desktop_note'));
  await attempt.started;
  noteDeferred = deferred();
  const execution = context.Wc(scope, '/fixture/Desktop');
  attempt.cancel();
  noteDeferred.resolve({path: '/fixture/Desktop/stale.txt'});
  await execution;
  assert.equal((await settled(attempt)).status, 'completed');
  assert.equal(attempt.signal.aborted, true);
  assert.equal(scope.get('Xc'), null);
  assert.equal(scope.get('co'), false);
  noteDeferred = null;
});

await verify('HTML chart entry executes the official asynchronous path and exposes its output', async () => {
  const scope = scopeFor('csv_chart');
  const entry = context.lc('html');
  const attempt = entry.prepare(scope, 'csv_chart', {projectRoot: '/fixture/outputs'});
  assert.equal(attempt.settled, false);
  assert.equal(calls.html.length, 0);
  attempt.start();
  const outcome = await settled(attempt);
  assert.equal(outcome.status, 'completed');
  assert.equal(outcome.output, '/fixture/outputs/review.html');
  assert.equal(calls.html[0].parentPath, '/fixture/outputs');
  assert.equal(calls.html[0].format, 'html');
  assert(new TextDecoder().decode(calls.html[0].bytes).includes('<main><h1>Video review fixture</h1></main>'));
  assert.equal(calls.png.length, 0);
  assert.equal(scope.get('Tc'), outcome.output);
  assert.equal(scope.get('co'), false, 'Completion must wait for the original generation animation');
  assert(functions.pc.includes('await n.createSampleChart({bytes:new TextEncoder().encode('));
  assert(functions.pc.includes('format:`html`,parentPath:r'));
});

await verify('Canceled HTML chart cannot publish a stale file or completion flag', async () => {
  const scope = scopeFor('csv_chart');
  const entry = context.lc('html');
  chartDeferred = deferred();
  const attempt = entry.prepare(scope, 'csv_chart', {projectRoot: '/fixture/outputs'});
  attempt.start();
  // Allow native pc to reach its host write before canceling its result.
  await new Promise(resolve => setImmediate(resolve));
  attempt.cancel('cancelled');
  chartDeferred.resolve({path: '/fixture/outputs/stale.html'});
  const outcome = await settled(attempt);
  assert.equal(outcome.status, 'completed');
  assert.equal(attempt.signal.aborted, true);
  assert.equal(scope.get('Tc'), null);
  assert.equal(scope.get('co'), false);
  chartDeferred = null;
});

const report = {checkedAt: new Date().toISOString(), input: sourceOnly ? 'vendor plus current extension' : 'actual ui-overlay', nativeUiInspected: false, realDesktopFilesWrittenByTest: false, hostFileAndStandaloneDocumentBoundariesMocked: true, sameTasksForEveryRole: ['desktop_note','csv_chart'], checks, passed: checks.length};
await fs.mkdir(path.join(root, 'build'), {recursive: true});
await fs.writeFile(path.join(root, 'build/native-demo-tasks-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Native demo tasks:', checks.length, 'checks passed.');
for (const check of checks) console.log('✓', check);
