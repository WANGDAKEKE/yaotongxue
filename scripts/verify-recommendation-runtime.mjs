import fs from 'node:fs/promises';
import {vendorPath} from './paths.mjs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {applyRecommendationExtension} from './recommendation-extension.mjs';

const root = new URL('../', import.meta.url);
const [runtimeSource, engineSource, catalog, official] = await Promise.all([
  fs.readFile(new URL('src/recommendation-runtime.js', root), 'utf8'),
  fs.readFile(new URL('src/recommendation-engine.js', root), 'utf8'),
  fs.readFile(new URL('src/recommendation-catalog.json', root), 'utf8').then(JSON.parse),
  fs.readFile(vendorPath('extracted-app/webview/assets/app-primary-9bb8fd8d770a.js'), 'utf8'),
]);
const checks = [];
const check = async (name, run) => { await run(); checks.push({name, passed: true}); };
const jsx = (type, props, key) => ({type, props, key});
const effects = [];
const updates = [];
const storage = new Map();
const atoms = {host: 'local', workspace: {cwd: '/project'}, projects: [{projectId: 'p', projectKind: 'local', path: '/project', rootPaths: ['/project']}], selection: {type: 'local', projectId: 'p'}};
let requestClient;
const context = vm.createContext({setTimeout, clearTimeout, AbortController, Uint32Array, Date, Math,
  crypto: webcrypto, YAO_RECOMMENDATION_CATALOG: catalog,
  localStorage: {getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value)},
  L9: {useMemo: fn => fn(), useRef: value => ({current: value}), useState: initial => [typeof initial === 'function' ? initial() : initial, value => updates.push(value)], useEffect: fn => effects.push(fn)},
  H9: {jsx, jsxs: jsx}, K9: {jsx, jsxs: jsx}, hv: 'scope', Av: 'host', Zle: 'workspace', are: 'projects', OS: 'selection',
  d: () => ({value: {clientThreadId: 'new-thread'}}), Z: key => atoms[key], ba: () => ({key: 'home-open'}), qh: () => requestClient,
});
vm.runInContext(engineSource.replace(/^export\s+(?=function\s)/gm, '') + '\n' + runtimeSource + '\nglobalThis.api={YaoRecRoot,YaoRecRequest,YaoRecThreadRows,YaoRecRecentFiles,YaoRecRow,YaoHomeRecommendations};', context);
const api = context.api;
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

await check('official composer, follow-up ref and all original source stay intact', () => {
  const patched = applyRecommendationExtension('app-primary-9bb8fd8d770a.js', official, {runtimeSource, engineSource, catalog});
  const restored = patched.split('\n// YAO_HOME_RECOMMENDATIONS_EXTENSION\n')[0]
    .replace(',e==null&&!k?(0,K9.jsx)(YaoHomeRecommendations,{controller:c}):null', '')
    .replace('hidden:e!=null,"data-yao-home-followups":"",ref:', 'hidden:e!=null,ref:');
  assert.equal(restored, official);
  const syntax = spawnSync(process.execPath, ['--check', '--input-type=module'], {input: patched, encoding: 'utf8'});
  assert.equal(syntax.status, 0, syntax.stderr);
  assert.throws(() => applyRecommendationExtension('app-primary-9bb8fd8d770a.js', patched, {runtimeSource, engineSource, catalog}), /checkpoint/);
});

await check('root selection excludes unselected home, private paths and traversal', () => {
  for (const path of ['', '~', '/', '/Users/person', '/project/../other', '/project/.codex', '/project/node_modules']) assert.equal(api.YaoRecRoot(path), null);
  assert.equal(api.YaoRecRoot('/Users/person/素材项目/'), '/Users/person/素材项目');
});

await check('file adapter reads metadata only within two child levels and ignores private or unrelated names', async () => {
  const calls = [];
  const entries = {
    '/project': [
      {fileName: '字幕.srt', isFile: true}, {fileName: 'README.md', isFile: true}, {fileName: '老照片.md', isFile: true},
      {fileName: 'credentials.txt', isFile: true}, {fileName: 'node_modules', isDirectory: true},
      {fileName: 'sub', isDirectory: true}, {fileName: 'linked', isDirectory: true},
    ],
    '/project/sub': [{fileName: '片段.mp4', isFile: true}, {fileName: 'deep', isDirectory: true}],
    '/project/sub/deep': [{fileName: '视频剪辑.md', isFile: true}, {fileName: 'third', isDirectory: true}],
  };
  const rpc = {sendRequest: async (method, params) => {
    calls.push([method, params.path]);
    assert.ok(['fs/getMetadata', 'fs/readDirectory'].includes(method));
    if (method === 'fs/readDirectory') return {entries: entries[params.path] ?? []};
    return {isDirectory: Boolean(entries[params.path] || params.path === '/project/linked'), isFile: !entries[params.path],
      isSymlink: params.path === '/project/linked', modifiedAtMs: Date.now()};
  }};
  const files = await api.YaoRecRecentFiles(rpc, '/project', new AbortController().signal);
  assert.equal(files.length, 3);
  assert.ok(files.every(file => file.path.startsWith('/project/') && file.modifiedAtMs > 0));
  assert.ok(!calls.some(([, path]) => /README|老照片|credentials|node_modules|third/.test(path)));
  assert.ok(!calls.some(([method, path]) => method === 'fs/readDirectory' && path === '/project/linked'));
});

await check('file inspection budget caps candidate metadata at sixty', async () => {
  let inspections = 0;
  const rpc = {sendRequest: async (method, params) => {
    if (method === 'fs/readDirectory') return {entries: Array.from({length: 100}, (_, index) => ({fileName: `片段${index}.mp4`, isFile: true}))};
    if (params.path === '/project') return {isDirectory: true, isSymlink: false};
    inspections++;
    return {isFile: true, isSymlink: false, modifiedAtMs: Date.now()};
  }};
  const files = await api.YaoRecRecentFiles(rpc, '/project', new AbortController().signal);
  assert.equal(inspections, 60);
  assert.equal(files.length, 60);
});

await check('thread adapter rejects stale, out-of-project, generated and subagent metadata', () => {
  const now = Date.now();
  const row = {id: 'a', name: '整理字幕', cwd: '/project', updatedAt: now / 1000};
  const actual = api.YaoRecThreadRows({data: [row, {...row, id: 'old', updatedAt: now / 1000 - 8 * 86400},
    {...row, id: 'other', cwd: '/other'}, {...row, id: 'ephemeral', ephemeral: true},
    {...row, id: 'agent', parentThreadId: 'parent'}, {...row, id: 'suggested', threadSource: 'ambient_suggestions'},
    {...row, id: 'review', threadSource: 'guardian_review'}, {...row, id: 'memory', threadSource: 'memory_consolidation'},
    {...row, id: 'source-agent', threadSource: 'subagent'}]}, '/project', now);
  assert.equal(actual.length, 1);
  assert.equal(actual[0].id, 'a');
});

await check('request timeout and cancellation never send a canceled queued request', async () => {
  await assert.rejects(api.YaoRecRequest({sendRequest: () => new Promise(() => {})}, 'thread/list', {}, new AbortController().signal, 10), /timed out/);
  const abort = new AbortController();
  let sent = 0;
  const promise = api.YaoRecRequest({sendRequest: async () => { sent++; }}, 'thread/list', {}, abort.signal);
  abort.abort();
  await assert.rejects(promise, /canceled/);
  await flush();
  assert.equal(sent, 0);
});

await check('recommendation rows fill and focus without auto-submit; unready controller is disabled', () => {
  const actions = [];
  const task = {id: 'general:hook', title: '找三个开场', description: '不出现在通用任务行', prompt: '检查真实材料', sourceKind: 'general', sourceLabel: '通用任务'};
  const row = api.YaoRecRow({task, controller: {setPromptText: prompt => actions.push(prompt), focus: () => actions.push('focus')}});
  row.props.onClick();
  assert.deepEqual(actions, ['检查真实材料', 'focus']);
  assert.equal(row.props.children[1].props.children.filter(Boolean).length, 1);
  const disabled = api.YaoRecRow({task, controller: null});
  assert.equal(disabled.props.disabled, true);
  assert.match(disabled.props['aria-label'], /尚未就绪/);
});

await check('homepage renders exactly six lightweight rows and cleanup blocks stale context updates', async () => {
  let resolveList;
  requestClient = {sendRequest: () => new Promise(resolve => { resolveList = resolve; })};
  const view = api.YaoHomeRecommendations({controller: {setPromptText() {}, focus() {}}});
  assert.equal(view.props.children.length, 2);
  assert.equal(view.props.children.flatMap(group => group.props.children).length, 6);
  const cleanup = effects.pop()();
  await flush();
  const count = updates.length;
  cleanup();
  resolveList?.({data: [{id: 'a', name: '整理字幕', cwd: '/project', updatedAt: Date.now() / 1000}]});
  await flush();
  await flush();
  assert.equal(updates.length, count);
});

await check('files and recent conversation are collected together and two real files remain first', async () => {
  const calls = [];
  requestClient = {sendRequest: async (method, params) => {
    calls.push(method);
    if (method === 'thread/list') return {data: [{id: 'recent-thread', name: '核对字幕断句', preview: '视频剪辑字幕', cwd: '/project', updatedAt: Date.now() / 1000}]};
    if (method === 'fs/readDirectory') return {entries: [{fileName: '第01集.srt', isFile: true}, {fileName: '第02集.mp4', isFile: true}]};
    if (params.path === '/project') return {isDirectory: true, isSymlink: false};
    return {isFile: true, isSymlink: false, modifiedAtMs: Date.now()};
  }};
  api.YaoHomeRecommendations({controller: {setPromptText() {}, focus() {}}});
  const cleanup = effects.pop()();
  await flush();
  await flush();
  const final = updates.at(-1);
  assert.equal(final.loading, false);
  assert.ok(calls.includes('thread/list') && calls.includes('fs/readDirectory'));
  assert.equal(final.result.metadata.fileContextCount, 2);
  assert.equal(final.result.context[0].sourceKind, 'file');
  assert.equal(final.result.context[1].sourceKind, 'file');
  assert.notEqual(final.result.context[0].sourceRef, final.result.context[1].sourceRef);
  assert.equal(final.result.context[2].sourceKind, 'thread');
  cleanup();
});

await check('canceling a slow file scan retains completed file metadata', async () => {
  let inspected = 0;
  const rpc = {sendRequest: async (method, params) => {
    if (method === 'fs/readDirectory') return {entries: Array.from({length: 12}, (_, index) => ({fileName: `素材${index}.mp4`, isFile: true}))};
    if (params.path === '/project') return {isDirectory: true, isSymlink: false};
    inspected++;
    if (inspected > 4) return new Promise(() => {});
    return {isFile: true, isSymlink: false, modifiedAtMs: Date.now()};
  }};
  const abort = new AbortController();
  const scan = api.YaoRecRecentFiles(rpc, '/project', abort.signal);
  await flush();
  abort.abort();
  const files = await scan;
  assert.equal(files.length, 4);
});

const report = {passed: true, checks, reviewedData: 'Synthetic metadata only; no user conversation bodies, project contents or account data were read.'};
await fs.mkdir(new URL('build/', root), {recursive: true});
await fs.writeFile(new URL('build/recommendation-runtime-verification.json', root), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
