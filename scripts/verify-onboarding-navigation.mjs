#!/usr/bin/env node
// Execute the actual extension with virtual JSX and the original vendor reset
// callback. This tests navigation state; it does not pretend to render Electron.
import assert from 'node:assert/strict';
import {vendorPath} from './paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {extendOnboarding} from './onboarding-extension.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendorAssets = vendorPath('extracted-app/webview/assets');
const pageName = 'onboarding-page-15d0879c5b68.js';
const source = await fs.readFile(path.join(vendorAssets, pageName), 'utf8');
const navigation = await fs.readFile(path.join(root, 'src/onboarding-navigation.js'), 'utf8');
const extended = extendOnboarding(pageName, source, {navigation, roleDemo: '', catalog: {}});

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, `Vendor checkpoint missing: ${startMarker}`);
  return text.slice(start, end);
}
// Run the callback produced by the real extension instead of reimplementing it.
const cancellation = between(extended, 'fn=()=>{r?.resetConversationalOutcome()', ',t[172]=r').slice(3);
const roleSubmission = between(source, 'ae=async e=>{if(te.current!=null)return;', ',t[9]=v').slice(3);
const abortAssignment = extended.match(/e\.yaoAbortRef&&\(e\.yaoAbortRef\.current=\(\)=>\{te\.current\?\.abort\(\),te\.current=null,ne\(!1\)\}\)/)?.[0];
assert.ok(abortAssignment, 'The original role-submission controller must expose its cancellation ref');

function workflowFixture() {
  return {
    phase: 'capabilities', selectedTask: {id: 'prior-demo-task'},
    permissionStatus: 'granted', declinedTasks: ['old-declined-task'],
    advancedCapabilitiesStatus: 'completed', advancedCapabilitiesToSetup: ['computer-use'],
    completedImport: {awaitingChoice: true},
    selectedRole: {role: 'something_else'},
    retainedMetadata: {source: 'personalized-onboarding'},
  };
}

function harness(initial = workflowFixture()) {
  const timeline = [];
  const atoms = new Map([['workflow', initial], ['role-preferences', {
    roles: ['something_else'], personalizedSuggestionsEnabled: false, workMode: 'production',
  }], ['task-controller', {id: 'old-controller'}]]);
  // These are state in the original np parent, separate from workflow and the
  // child Pf that navigation remounts. An old ce(null)/rt('') reset would fail.
  const parentRoleHooks = {roleSelection: 'something_else', customRoleDescription: '纪录片先导片剪辑师'};
  const rolePreferences = atoms.get('role-preferences');
  const scope = {
    get: key => atoms.get(key),
    set(key, value) { timeline.push({type: 'store', key}); atoms.set(key, value); },
  };
  let hookCursor = 0;
  const hooks = [];
  const React = {
    useState(initialValue) {
      const index = hookCursor++;
      if (!hooks[index]) hooks[index] = {value: typeof initialValue === 'function' ? initialValue() : initialValue};
      return [hooks[index].value, update => {
        hooks[index].value = typeof update === 'function' ? update(hooks[index].value) : update;
      }];
    },
    useRef(initialValue) {
      const index = hookCursor++;
      if (!hooks[index]) hooks[index] = {current: initialValue};
      return hooks[index];
    },
  };
  const jsx = {Fragment: Symbol('Fragment'), jsx: (type, props, key) => ({type, props, key})};
  jsx.jsxs = jsx.jsx;
  const OriginalPage = function OriginalPage() {};
  const OriginalButton = function OriginalButton() {};
  const context = vm.createContext({
    h: () => React, k: () => jsx, Fo: Symbol('scope'), i: () => scope,
    no: 'workflow', J: atom => atoms.get(atom), oo: () => atoms.get('workflow'),
    Pf: OriginalPage, me: OriginalButton,
    u: scope, Y: initial.selectedTask,
    r: {resetConversationalOutcome() { timeline.push({type: 'outcome-reset'}); }},
    Mt(task) { timeline.push({type: 'attempt-cancel', task}); },
    ms() { timeline.push({type: 'generation-reset'}); }, hs: 'task-controller', un: 'role-preferences',
    io() { timeline.push({type: 'unwanted-full-workflow-reset'}); },
    ce(value) { parentRoleHooks.roleSelection = value; },
    rt(value) { parentRoleHooks.customRoleDescription = value; },
  });
  const api = vm.runInContext(navigation + '\n;({YaoOnboardingStage,YaoReturnToOnboardingStep,YaoStepProgress,YaoNavigableOnboarding})', context);
  const cancelTask = vm.runInContext(`(${cancellation})`, context);
  const callbackCalls = [];
  const callback = name => (...args) => callbackCalls.push({name, args});
  const originalCallbacks = {
    onGetStarted: callback('complete'), onStartWorking: callback('start-working'),
    onContinueRole: callback('continue-role'), onSelectTask: callback('select-task'),
    onRoleSelectionChange: callback('role-change'), onCustomRoleDescriptionChange: callback('custom-role-change'),
    onSkip: callback('skip'), onInitialRoleCaptured: callback('capture-role'),
  };
  const shellControls = {
    setHeaderHasScrolledContent(value) { timeline.push({type: 'shell-scroll', value}); },
    setBackgroundVisibility(value) { timeline.push({type: 'shell-background', value}); },
  };
  let pending = false;
  const render = () => {
    hookCursor = 0;
    return api.YaoNavigableOnboarding({
      ...originalCallbacks, workflow: atoms.get('workflow'), isAdvancePending: pending,
      onYaoCancelTask: cancelTask, shellControls,
    });
  };
  const page = tree => tree.props.children[0];
  const footer = tree => tree.props.children[1];
  const navigate = (tree, target) => page(tree).props.yaoProgress.props.onNavigate(target);
  const mountOriginalRoleAbort = tree => {
    const controller = {abort() { timeline.push({type: 'role-abort'}); }};
    context.e = page(tree).props;
    context.te = {current: controller};
    context.ne = value => timeline.push({type: 'role-pending', value});
    vm.runInContext(abortAssignment, context);
    return context.te;
  };
  return {
    api, context, scope, atoms, timeline, render, page, footer, navigate,
    mountOriginalRoleAbort, OriginalPage, parentRoleHooks, rolePreferences,
    originalCallbacks, callbackCalls, setPending(value) { pending = value; },
  };
}

function assertCleared(workflow, phase) {
  assert.equal(workflow.phase, phase);
  assert.equal(workflow.selectedTask, null);
  assert.equal(workflow.permissionStatus, 'not-requested');
  assert.equal(workflow.declinedTasks.length, 0);
  for (const key of ['advancedCapabilitiesStatus', 'advancedCapabilitiesToSetup', 'completedImport']) {
    assert.equal(workflow[key], undefined, `${key} must not survive a return to an earlier step`);
  }
}

test('real return function handles work demonstration → task recommendation → role', () => {
  const h = harness();
  const original = h.atoms.get('workflow');
  assert.equal(h.api.YaoOnboardingStage(original), 2);
  assert.equal(h.api.YaoReturnToOnboardingStep(h.scope, 1, () => h.timeline.push({type: 'cancel'})), true);
  assertCleared(h.atoms.get('workflow'), 'task');
  assert.equal(h.atoms.get('workflow').retainedMetadata, original.retainedMetadata);
  assert.equal(h.api.YaoOnboardingStage(h.atoms.get('workflow')), 1);
  assert.equal(h.api.YaoReturnToOnboardingStep(h.scope, 0, () => h.timeline.push({type: 'cancel'})), true);
  assertCleared(h.atoms.get('workflow'), 'role');
  assert.equal(h.api.YaoOnboardingStage(h.atoms.get('workflow')), 0);
  assert.deepEqual(h.timeline.map(event => event.type), ['cancel', 'store', 'cancel', 'store']);
});

test('invalid, current and future targets are no-ops without cancellation or writes', () => {
  for (const [phase, selectedTask, targets] of [
    ['role', null, [-1, 0, 1, 2, 99, 0.5, NaN, Infinity, '0', null, undefined]],
    ['task', null, [-1, 1, 2, 99, 0.5, NaN, Infinity, '0']],
    ['capabilities', {id: 'old'}, [-1, 2, 3, 99, 0.5, NaN, Infinity, '1']],
  ]) {
    const initial = {...workflowFixture(), phase, selectedTask};
    const h = harness(initial);
    for (const target of targets) {
      assert.equal(h.api.YaoReturnToOnboardingStep(h.scope, target, () => { throw new Error('must not cancel'); }), false);
    }
    assert.equal(h.atoms.get('workflow'), initial);
    assert.equal(h.timeline.length, 0);
  }
});

test('a cancellation failure cannot write a misleading new workflow', () => {
  const h = harness();
  const current = h.atoms.get('workflow');
  assert.throws(() => h.api.YaoReturnToOnboardingStep(h.scope, 0, () => { throw new Error('cancel failed'); }), /cancel failed/);
  assert.equal(h.atoms.get('workflow'), current);
  assert.equal(h.timeline.length, 0);
});

test('wrapper retains np role selection, custom input and personalized preference across both returns', () => {
  const h = harness();
  const originalRole = h.atoms.get('workflow').selectedRole;
  const before = {...h.parentRoleHooks};
  let tree = h.render();
  h.navigate(tree, 1);
  tree = h.render();
  h.navigate(tree, 0);
  assert.deepEqual(h.parentRoleHooks, before);
  assert.equal(h.atoms.get('workflow').selectedRole, originalRole);
  assert.equal(h.atoms.get('role-preferences'), h.rolePreferences);
  assert.equal(h.atoms.get('role-preferences').personalizedSuggestionsEnabled, false);
  assert.equal(h.atoms.get('task-controller'), null);
  assert.equal(h.timeline.filter(event => event.type === 'attempt-cancel').length, 2);
  assert.equal(h.timeline.filter(event => event.type === 'generation-reset').length, 2);
  assert.equal(h.timeline.filter(event => event.type === 'unwanted-full-workflow-reset').length, 0);
});

test('original role AbortController and task cancellation run before workflow store writes', () => {
  const h = harness();
  const tree = h.render();
  const originalControllerRef = h.mountOriginalRoleAbort(tree);
  h.navigate(tree, 0);
  const eventTypes = h.timeline.map(event => event.type);
  assert.deepEqual(eventTypes.slice(0, 5), ['role-abort', 'role-pending', 'outcome-reset', 'attempt-cancel', 'generation-reset']);
  const workflowWrite = h.timeline.findIndex(event => event.type === 'store' && event.key === 'workflow');
  assert.ok(workflowWrite > eventTypes.indexOf('attempt-cancel'));
  assert.equal(originalControllerRef.current, null);
  assert.equal(h.timeline.find(event => event.type === 'role-pending').value, false);
  assertCleared(h.atoms.get('workflow'), 'role');
});

test('actual vendor async role submission cannot change the returned page after cancellation', async () => {
  const h = harness();
  const tree = h.render();
  let releaseSubmission, submissionSignal, reportPhase;
  const deferred = new Promise(resolve => { releaseSubmission = resolve; });
  h.context.AbortController = AbortController;
  h.context.te = {current: null};
  h.context.ne = value => h.timeline.push({type: 'role-pending', value});
  h.context.v = (role, signal, updatePhase) => {
    submissionSignal = signal;
    reportPhase = updatePhase;
    return deferred;
  };
  h.context.M = true;
  h.context.ee = value => h.timeline.push({type: 'late-role-import', value});
  h.context.F = value => h.timeline.push({type: 'late-role-phase', value});
  h.scope.setBackgroundVisibility = value => h.timeline.push({type: 'late-role-background', value});
  h.context.e = h.page(tree).props;
  vm.runInContext(abortAssignment, h.context);
  const submit = vm.runInContext(`(${roleSubmission})`, h.context);
  const pendingSubmission = submit('something_else');
  assert.equal(submissionSignal.aborted, false);
  h.navigate(tree, 0);
  assert.equal(submissionSignal.aborted, true);
  assert.equal(h.context.te.current, null);
  reportPhase('task');
  releaseSubmission();
  await pendingSubmission;
  assert.equal(h.timeline.filter(event => event.type.startsWith('late-role-')).length, 0);
  assert.deepEqual(h.timeline.filter(event => event.type === 'role-pending').map(event => event.value), [true, false]);
  assertCleared(h.atoms.get('workflow'), 'role');
});

test('wrapper remounts the original Pf with a new key and restores each step shell', () => {
  const h = harness();
  let tree = h.render();
  assert.equal(h.page(tree).type, h.OriginalPage);
  assert.equal(h.page(tree).key, 0);
  h.navigate(tree, 1);
  tree = h.render();
  assert.equal(h.page(tree).type, h.OriginalPage);
  assert.equal(h.page(tree).key, 1);
  assert.equal(h.page(tree).props.yaoProgress.props.activeIndex, 1);
  h.navigate(tree, 0);
  tree = h.render();
  assert.equal(h.page(tree).key, 2);
  assert.equal(h.page(tree).props.yaoProgress.props.activeIndex, 0);
  assert.deepEqual(h.timeline.filter(event => event.type === 'shell-background').map(event => event.value), ['hidden', 'visible']);
  assert.ok(h.timeline.filter(event => event.type === 'shell-scroll').every(event => event.value === false));
});

test('previous-step and change-role controls use the same guarded return path', () => {
  const h = harness();
  let tree = h.render();
  h.footer(tree).props.children[0].props.onClick();
  assert.equal(h.api.YaoOnboardingStage(h.atoms.get('workflow')), 1);
  tree = h.render();
  h.footer(tree).props.children[1].props.onClick();
  assert.equal(h.api.YaoOnboardingStage(h.atoms.get('workflow')), 0);
  tree = h.render();
  assert.equal(h.footer(tree).props.children[0].props.disabled, true);
  assert.equal(h.footer(tree).props.children[1], null);
});

test('pending advancement prevents every navigation entry, including direct callbacks', () => {
  const h = harness();
  h.setPending(true);
  const tree = h.render();
  h.navigate(tree, 0);
  h.footer(tree).props.children[0].props.onClick();
  h.footer(tree).props.children[1].props.onClick();
  assert.equal(h.timeline.length, 0);
  assert.equal(h.page(tree).key, 0);
  assert.equal(h.page(tree).props.yaoProgress.props.disabled, true);
  assert.ok(h.footer(tree).props.children.filter(Boolean).every(button => button.props.disabled));
});

test('wrapper also rejects future, current, fractional and negative direct step clicks', () => {
  const h = harness({...workflowFixture(), phase: 'task', selectedTask: null});
  const tree = h.render();
  for (const target of [-1, 0.5, 1, 2, 9, NaN]) h.navigate(tree, target);
  assert.equal(h.timeline.length, 0);
  assert.equal(h.page(h.render()).key, 0);
});

test('three textless bars retain accessible labels and backward navigation', () => {
  const h = harness();
  const called = [];
  const progress = h.api.YaoStepProgress({activeIndex: 1, disabled: false, onNavigate: index => called.push(index)});
  assert.equal(progress.type, 'nav');
  assert.equal(progress.props['aria-label'], '新人引导步骤');
  const buttons = progress.props.children;
  assert.equal(buttons.length, 3);
  for (const button of buttons) {
    assert.equal(button.props.children.type, 'span');
    assert.equal(button.props.children.props.className, 'yao-onboarding-step-bar');
    assert.equal(button.props.children.props.children, undefined, 'Bars must contain no visible number or label');
    assert.equal(button.props.children.props['aria-hidden'], true);
    assert.ok(button.props['aria-label']);
  }
  assert.deepEqual(Array.from(buttons, button => button.props.disabled), [false, false, true]);
  assert.deepEqual(Array.from(buttons, button => button.props['aria-current']), [undefined, 'step', undefined]);
  assert.equal(buttons[0].props['data-complete'], true);
  assert.match(buttons[0].props['aria-label'], /点击返回/);
  buttons[0].props.onClick();
  assert.deepEqual(called, [0]);
  const pending = h.api.YaoStepProgress({activeIndex: 2, disabled: true, onNavigate() {}});
  assert.ok(pending.props.children.every(button => button.props.disabled));
});

test('completion and card callbacks retain their original function identities after remount', () => {
  const h = harness();
  let tree = h.render();
  for (const [name, callback] of Object.entries(h.originalCallbacks)) assert.equal(h.page(tree).props[name], callback);
  h.navigate(tree, 0);
  tree = h.render();
  for (const [name, callback] of Object.entries(h.originalCallbacks)) assert.equal(h.page(tree).props[name], callback);
  assert.equal(h.callbackCalls.length, 0, 'Navigation must not complete onboarding or submit a task');
  h.page(tree).props.onGetStarted();
  h.page(tree).props.onSelectTask({id: 'new-card'});
  assert.deepEqual(h.callbackCalls.map(call => call.name), ['complete', 'select-task']);
});

test('extension preserves official completion, role-card and demo-click implementations', async () => {
  for (const [start, end] of [['function Pc()', 'var '], ['function vm(', 'var ym,bm,xm']]) {
    assert.ok(extended.includes(between(source, start, end)), `Original implementation changed: ${start}`);
  }
  const starterName = 'onboarding-starter-tasks-e4ec246ae130.js';
  const starter = await fs.readFile(path.join(vendorAssets, starterName), 'utf8');
  const starterExtended = extendOnboarding(starterName, starter, {navigation, roleDemo: '', catalog: {}});
  const handler = starter.match(/onClick: \(\) => GenUI\.issueNewTurn\(task\.label,[\s\S]*?\} \} \} \}\)/)?.[0];
  assert.ok(handler, 'Original demo click checkpoint must exist');
  assert.ok(starterExtended.includes(handler));
  assert.ok(extended.includes('t[215]!==fn') && extended.includes('t[215]=fn'), 'Parent memo must invalidate when the cancel callback changes');
  assert.ok(extended.includes('t[88]!==e.yaoProgress') && extended.includes('t[88]=e.yaoProgress'), 'Original footer memo must invalidate when progress changes');
});
