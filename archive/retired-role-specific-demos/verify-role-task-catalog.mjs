import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chunkPath = path.join(root, 'build/ui-overlay/webview/assets/tasks-4aa0b66fb4ee.js');
const demoPath = path.join(root, 'src/role-task-demo.js');
const catalogPath = path.join(root, 'src/role-task-catalog.json');
const reportPath = path.join(path.dirname(root), 'analysis/role-task-catalog-verification.json');
const [chunk, demoSource, catalogText] = await Promise.all([
  fs.readFile(chunkPath, 'utf8'),
  fs.readFile(demoPath, 'utf8'),
  fs.readFile(catalogPath, 'utf8')
]);
const catalog = JSON.parse(catalogText);
const roles = Object.keys(catalog);
const checks = [];
const verify = (name, run) => {
  run();
  checks.push(name);
};
const plain = value => JSON.parse(JSON.stringify(value));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

// Function boundaries are explicit checkpoints for this pinned vendor build.
// Evaluating the full bundle would initialize unrelated application services.
function extractFunction(name, nextName) {
  const marker = `function ${name}(`;
  const start = chunk.indexOf(marker);
  assert.notEqual(start, -1, `Missing built function ${name}`);
  assert.equal(chunk.indexOf(marker, start + marker.length), -1, `Ambiguous built function ${name}`);
  const end = chunk.indexOf(`function ${nextName}(`, start + marker.length);
  assert.notEqual(end, -1, `Missing boundary ${nextName} after ${name}`);
  const source = chunk.slice(start, end).trim();
  new vm.Script(`(${source})`, {filename: `built:${name}`});
  return source;
}

const boundaries = {
  fu: 'pu',
  vu: 'yu',
  _u: 'vu',
  yu: 'bu',
  bu: 'xu',
  yo: 'bo',
  bo: 'xo',
  pu: 'mu',
  xu: 'Su'
};
const functions = Object.fromEntries(Object.entries(boundaries).map(([name, next]) => [name, extractFunction(name, next)]));
// Su is immediately followed by a var block, rather than another function.
const clearPinStart = chunk.indexOf('function Su(');
const clearPinEnd = chunk.indexOf('var Cu,', clearPinStart);
assert.ok(clearPinStart >= 0 && clearPinEnd > clearPinStart, 'Missing task-pin reset boundary');
functions.Su = chunk.slice(clearPinStart, clearPinEnd).trim();
new vm.Script(`(${functions.Su})`, {filename: 'built:Su'});

const getterPrefix = 'Iu=o(q,';
const getterStart = chunk.indexOf(getterPrefix);
const getterEnd = chunk.indexOf(',Lu=o', getterStart);
assert.ok(getterStart >= 0 && getterEnd > getterStart, 'Missing built Iu visible-task getter');
const getterCall = chunk.slice(getterStart + getterPrefix.length, getterEnd);
assert.ok(getterCall.endsWith(')'), 'Unexpected Iu getter boundary');
const getterSource = getterCall.slice(0, -1);
new vm.Script(`(${getterSource})`, {filename: 'built:Iu'});

verify('Built extension and catalog exactly match current source inputs', () => {
  assert.ok(chunk.includes(demoSource), 'Built demo module is stale');
  assert.ok(chunk.includes(`var YAO_ROLE_TASK_CATALOG=${JSON.stringify(catalog)};`), 'Built catalog is stale');
});
verify('Demo module initializes without any vendor bindings', () => {
  vm.runInNewContext(demoSource, {}, {filename: demoPath, timeout: 1000});
});
verify('Catalog has twelve roles and thirty-six distinct complete tasks', () => {
  assert.equal(roles.length, 12);
  const ids = [];
  for (const [role, tasks] of Object.entries(catalog)) {
    assert.equal(tasks.length, 3, `${role}: expected three tasks`);
    assert.equal(new Set(tasks.map(task => task.id)).size, 3, `${role}: duplicate IDs`);
    for (const task of tasks) {
      assert.match(task.id, /^yao_demo_/);
      assert.ok(task.title.trim(), `${task.id}: empty title`);
      assert.ok(task.prompt.trim(), `${task.id}: empty prompt`);
      ids.push(task.id);
    }
  }
  assert.equal(new Set(ids).size, 36, 'IDs must distinguish tasks across roles');
});

let renderingScope = null;
let hookReads = 0;
const externalCalls = {pluginFilter: 0, pluginHandler: 0, computerUse: 0};
const jsx = (type, props, key) => ({type, props: props ?? {}, key});
const context = vm.createContext({
  AbortController,
  Map,
  Set,
  Object,
  Array,
  String,
  Promise,
  YAO_ROLE_TASK_CATALOG: catalog,
  co: 'co', uo: 'uo', J: 'J', ju: 'ju', si: 'si', Fu: 'Fu', Nu: 'Nu', zu: 'zu',
  Du: 8, Eu: 2,
  Fi: {tasks: {}},
  oi: ['desktop_note', 'csv_chart', 'hold_next_free_hour', 'send_message_to_self'],
  ku: {desktop_note: {native: 'note'}, csv_chart: {native: 'chart'}},
  Au: {desktop_note: {native: 'note'}, csv_chart: {native: 'chart'}},
  Yr: {safeParse: value => ({success: ['desktop_note', 'csv_chart'].includes(value), data: value})},
  Xn: () => null,
  li: () => { externalCalls.pluginFilter++; throw new Error('Demo entered plugin filtering'); },
  Jl: () => { externalCalls.pluginHandler++; throw new Error('Demo entered plugin execution'); },
  es: () => { externalCalls.computerUse++; throw new Error('Demo entered computer use'); },
  wu: {default: values => [...values].reverse()},
  Lc: function VendorIcon() {},
  nl: {option: {Icon: function ExistingVendorIcon() {}}},
  Be() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return {promise, resolve};
  },
  di: scope => scope.get('si'),
  ei: (scope, status) => scope.set('si', {...scope.get('si'), permissionStatus: status}),
  mi: scope => scope.set('si', {...scope.get('si'), phase: 'execution'}),
  B: key => {
    assert.ok(renderingScope, 'View hook read outside a mocked render');
    hookReads++;
    return renderingScope.get(key);
  },
  v: () => ({jsx, jsxs: jsx})
});
vm.runInContext(Object.values(functions).join('\n') + '\n' + demoSource, context, {filename: 'built-task-harness', timeout: 1000});
const visibleTaskIds = vm.runInContext(`(${getterSource})`, context, {filename: 'built:Iu', timeout: 1000});

function scopeFor(role, taskId = null) {
  const values = new Map([
    ['si', {declinedTasks: [], phase: 'task', selectedRole: role, selectedTask: taskId, permissionStatus: 'not-requested'}],
    ['co', false], ['uo', false], ['J', false], ['Nu', null], ['Fu', []]
  ]);
  return {
    values,
    get(atom, argument) {
      if (atom === 'zu') return values.get('ju')?.entries.get(argument) ?? null;
      return values.get(atom);
    },
    set(atom, value) { values.set(atom, typeof value === 'function' ? value(values.get(atom)) : value); }
  };
}

function makeCatalog(role) {
  const assigned = context.fu(role);
  assert.deepEqual(plain(assigned.task_ids), catalog[role].map(task => task.id), `${role}: fu returned wrong IDs`);
  const result = context._u({
    computerUseAvailable: false,
    platform: 'macOS',
    config: {tasks: assigned.task_definitions},
    taskIds: assigned.task_ids,
    locale: 'zh-CN',
    mailProvider: null,
    plan: null,
    randomizeOrder: false
  });
  assert.equal(result.hasAssignedTasks, true, `${role}: assignment was lost`);
  assert.deepEqual(plain(result.catalog.visibleTaskIds), catalog[role].map(task => task.id));
  assert.equal(result.catalog.pluginIds.size, 0);
  assert.equal(result.catalog.pluginNames.size, 0);
  return result.catalog;
}

function textOf(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  if (typeof node.type === 'function') return textOf(node.type(node.props));
  return textOf(node.props?.children);
}

function render(entry, scope, id) {
  renderingScope = scope;
  try { return textOf(entry.View({task: id, context: {}})); }
  finally { renderingScope = null; }
}

async function outcome(attempt) {
  let timer;
  try {
    return await Promise.race([
      attempt.result,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Task attempt did not settle')), 1000); })
    ]);
  } finally { clearTimeout(timer); }
}

const builtCatalogs = new Map();
let completedViews = 0;
for (const role of roles) {
  const builtCatalog = makeCatalog(role);
  builtCatalogs.set(role, builtCatalog);
  for (const definition of catalog[role]) {
    const entry = builtCatalog.entries.get(definition.id);
    assert.ok(entry, `${definition.id}: absent from actual _u catalog`);
    assert.equal(context.bu(entry), false, 'A demo must not be a plugin task');
    assert.equal(entry.option.label.defaultMessage, definition.title);
    const scope = scopeFor(role, definition.id);
    const attempt = entry.prepare(scope, definition.id, {});
    assert.equal(attempt.settled, false, 'prepare must wait for the original start stage');
    assert.equal(scope.get('co'), false);
    assert.equal(scope.get('uo'), false);
    assert.equal(render(entry, scope, definition.id), '', 'Demo result rendered before start');
    attempt.start();
    assert.equal((await outcome(attempt)).status, 'completed');
    assert.equal(scope.get('si').phase, 'execution');
    assert.equal(scope.get('si').permissionStatus, 'allowed');
    assert.equal(scope.get('co'), true);
    assert.equal(scope.get('uo'), true);
    const text = render(entry, scope, definition.id);
    assert.ok(text.includes(definition.title), `${definition.id}: title missing`);
    assert.ok(text.includes(definition.prompt), `${definition.id}: full prompt was changed or truncated`);
    assert.ok(text.includes('所需材料') && text.includes('工作方法'));
    assert.ok(text.includes('这里展示任务的工作方式，不会开始实际制作。'), 'Missing product-facing demo boundary');
    completedViews++;
    entry.reset(scope);
    assert.equal(scope.get('co'), false);
    assert.equal(scope.get('uo'), false);
    assert.equal(scope.get('J'), false);
    assert.equal(render(entry, scope, definition.id), '');
  }
}
checks.push('Actual fu/vu/_u produce three visible non-plugin tasks for each of twelve roles');
checks.push('All thirty-six actual entries wait for start, complete locally, and render the full prompt through mocked View hooks');

for (const role of roles) {
  const [first, second] = catalog[role];
  const entry = context.YaoRoleTaskEntry(first.id);
  let scope = scopeFor(role, first.id);
  let attempt = entry.prepare(scope);
  scope.set('si', {...scope.get('si'), selectedTask: second.id});
  attempt.start();
  assert.equal((await outcome(attempt)).status, 'interrupted');
  assert.equal(scope.get('co'), false, 'Stale task completed another selection');
  assert.equal(scope.get('uo'), false);

  scope = scopeFor(role, first.id);
  attempt = entry.prepare(scope);
  attempt.cancel('cancelled');
  attempt.start();
  assert.equal((await outcome(attempt)).status, 'cancelled');
  assert.equal(scope.get('co'), false, 'Cancelled task wrote completion');
  assert.equal(scope.get('uo'), false);

  scope = scopeFor(role, first.id);
  attempt = entry.retry(scope, first.id, {});
  assert.equal((await outcome(attempt)).status, 'completed');
  entry.reset(scope);
}
checks.push('Stale and cancelled attempts cannot mark completion; retry follows the same lifecycle');

for (let index = 0; index < roles.length; index++) {
  const roleA = roles[index];
  const roleB = roles[(index + 1) % roles.length];
  const oldCatalog = builtCatalogs.get(roleA);
  const newCatalog = builtCatalogs.get(roleB);
  const scope = scopeFor(roleA);
  context.pu(scope, oldCatalog);
  assert.deepEqual(plain(visibleTaskIds({get: key => scope.get(key)})), catalog[roleA].map(task => task.id));
  const oldId = catalog[roleA][0].id;
  context.xu(scope, oldId);
  assert.equal(scope.get('Nu').taskId, oldId);
  context.Su(scope);
  assert.equal(scope.get('Nu'), null, 'Pinned old task was not cleared');

  // The new role is already selected while its asynchronous catalog is loading.
  scope.set('si', {...scope.get('si'), selectedRole: roleB, selectedTask: null});
  assert.equal(visibleTaskIds({get: key => scope.get(key)}), null, 'Iu exposed the previous role during catalog refresh');
  context.pu(scope, newCatalog);
  const visible = plain(visibleTaskIds({get: key => scope.get(key)}));
  assert.deepEqual(visible, catalog[roleB].map(task => task.id));
  assert.ok(visible.every(id => !catalog[roleA].some(task => task.id === id)), 'Old role cards leaked');
  for (const task of catalog[roleA]) assert.equal(scope.get('ju').entries.has(task.id), false, 'Old entry remained in the new catalog');
  scope.set('Fu', null);
  assert.equal(visibleTaskIds({get: key => scope.get(key)}), null, 'Pending filtering must retain the loading state');
}
checks.push('Actual Iu hides old-role cards until all three new-role IDs arrive');
checks.push('Actual pu replaces the catalog and actual Su clears the pinned previous entry');
verify('No plugin filtering or execution path was invoked', () => {
  assert.deepEqual(externalCalls, {pluginFilter: 0, pluginHandler: 0, computerUse: 0});
});
verify('Unknown IDs cannot create a local task entry', () => {
  assert.equal(context.YaoRoleTaskEntry('yao_demo_missing'), null);
  assert.equal(context.YaoRoleTaskEntry('computer_use'), null);
});

const report = {
  validatedAt: new Date().toISOString(),
  chunk: chunkPath,
  chunkSha256: hash(chunk),
  demoSourceSha256: hash(demoSource),
  catalogSha256: hash(catalogText),
  roles: roles.length,
  completedViews,
  viewHookReads: hookReads,
  checks,
  actualBuiltFunctions: Object.keys(functions),
  actualVisibleTaskGetter: getterSource,
  externalCalls,
  modelCalls: 0,
  ipcCalls: 0,
  artifactWrites: 0,
  limits: 'A VM integration check with mocked vendor scope/React hooks; no application or UI was launched.'
};
await fs.mkdir(path.dirname(reportPath), {recursive: true});
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(`Verified ${roles.length} roles / ${completedViews} complete task views; old-role isolation, cancellation and original attempt lifecycle passed.`);
console.log(`Report: ${reportPath}`);
