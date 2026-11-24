import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'src/recommendation-engine.js'), 'utf8');
const {createRecommendations, serializeRecommendations} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const catalog = JSON.parse(await fs.readFile(path.join(root, 'src/recommendation-catalog.json'), 'utf8'));
const now = Date.parse('2026-10-22T10:00:00+08:00');
const selectedCwd = '/Users/editor/Projects/新剧素材';
const base = {catalog, now, selectedCwd, seed: 'opening-1'};
const checks = [];
function check(name, run) { run(); checks.push(name); }
const taskId = card => (typeof card === 'string' ? card : card.id).split('::').at(-1).replace(/^general:/, '');
function assertCards(result) {
  assert.equal(result.context.length, 3);
  assert.equal(result.general.length, 3);
  const genuineSources = result.context.filter(card => ['file', 'thread'].includes(card.sourceKind)).map(card => `${card.sourceKind}:${card.sourceRef}`);
  assert.equal(new Set(genuineSources).size, genuineSources.length);
  assert.equal(new Set([...result.context, ...result.general].map(taskId)).size, 6);
  for (const card of [...result.context, ...result.general]) {
    assert.deepEqual(Object.keys(card).sort(), ['id', 'title', 'description', 'prompt', 'sourceKind', 'sourceLabel', 'sourceRef'].sort());
    assert(card.title.length <= (card.sourceKind === 'general' ? 36 : 40));
    if (card.sourceKind === 'general') {
      const task = catalog.find(value => value.id === card.sourceRef);
      assert(card.title.length >= 18);
      assert.equal(card.title, task.suggestion);
      assert.notEqual(card.title, task.title);
      assert(card.prompt.includes(task.prompt));
    }
    assert(card.description.length > 0);
    assert(card.prompt.length > 50);
    assert(!/先导片|ChatGPT|[·•]/i.test(`${card.title} ${card.description} ${card.sourceLabel}`));
  }
}

check('Professional task pool has 21 unique actions with usable prompts', () => {
  assert.equal(catalog.length, 21);
  assert.equal(new Set(catalog.map(task => task.id)).size, 21);
  for (const task of catalog) {
    assert(task.title.length > 0);
    assert(task.suggestion.length >= 18 && task.suggestion.length <= 36);
    assert(task.suggestion.includes('，'));
    assert(task.description.length <= 28);
    assert(task.prompt.length >= 60);
    assert(!/先导片|ChatGPT|[·•]/i.test(JSON.stringify(task)));
  }
  for (const id of ['hook', 'relationship', 'cut', 'cards', 'audio', 'vertical', 'variants', 'delivery']) {
    assert(catalog.some(task => task.id === id));
  }
});

check('Without sources, three explicit missing-file actions appear', () => {
  const result = createRecommendations(base);
  assertCards(result);
  assert.equal(result.metadata.contextOrigin, 'project');
  assert.equal(result.metadata.fileContextCount, 0);
  assert.equal(result.metadata.requiresFileContext, true);
  assert.deepEqual(result.context.map(card => card.sourceKind), ['missing-file', 'missing-file', 'missing-file']);
  for (const card of result.context) {
    assert.equal(card.sourceRef, '');
    assert.equal(card.sourceLabel, '需要项目素材');
    assert(card.prompt.includes('不能虚构最近文件'));
    assert(!/最近|已读取|已分析/.test(card.description));
  }
});

check('One file is used once, then two distinct recent conversations fill the remaining rows', () => {
  const result = createRecommendations({...base,
    threads: [
      {id: 'subtitle-thread', name: '检查短视频字幕断句', preview: '准备修订手机阅读字幕', cwd: selectedCwd, updatedAt: (now - 60000) / 1000},
      {id: 'actor-thread', title: '整理演员的表演高光', summary: '眼神和动作', cwd: selectedCwd, updatedAt: now - 120000},
    ],
    files: [{name: '刚更新的片段.mp4', path: '刚更新的片段.mp4', modifiedAtMs: now - 1000, type: 'file'}],
  });
  assertCards(result);
  assert.equal(result.metadata.contextOrigin, 'file');
  assert.equal(result.metadata.recentThreadCount, 2);
  assert.equal(result.metadata.fileContextCount, 1);
  assert.equal(result.metadata.requiresFileContext, true);
  assert.deepEqual(result.context.map(card => card.sourceKind), ['file', 'thread', 'thread']);
  assert.equal(result.context[0].sourceRef, `${selectedCwd}/刚更新的片段.mp4`);
  assert.equal(result.context[1].sourceRef, 'subtitle-thread');
  assert.equal(result.context[2].sourceRef, 'actor-thread');
  assert(result.context.some(card => card.sourceRef === 'subtitle-thread'));
  assert(result.context[1].prompt.includes('请先查看这次对话'));
  assert(result.context[1].prompt.includes('检查短视频字幕断句'));
});

check('A genuine thread appears once and remaining input is explicitly missing', () => {
  const result = createRecommendations({...base, threads: [{id: 't1', title: '核对跨集人物关系', cwd: selectedCwd, updatedAt: now - 1000}]});
  assertCards(result);
  assert.deepEqual(result.context.map(card => card.sourceKind), ['thread', 'missing-file', 'missing-file']);
  assert.equal(result.context[0].sourceRef, 't1');
  assert.equal(taskId(result.context[0]), 'relationship');
});

check('An untitled official thread uses its genuine preview as a bounded locator', () => {
  const preview = '请把第03集字幕里的长句拆开，保留人物称呼和台词原意。还要检查手机阅读节奏。';
  const result = createRecommendations({...base, threads: [{id: 'untitled', name: null, preview,
    cwd: selectedCwd, updatedAt: (now - 1000) / 1000}]});
  assertCards(result);
  assert.equal(result.metadata.recentThreadCount, 1);
  assert.equal(result.context[0].sourceKind, 'thread');
  assert.equal(result.context[0].sourceRef, 'untitled');
  assert.equal(result.context[0].sourceLabel, preview.split('。')[0]);
  assert.equal(taskId(result.context[0]), 'subtitles');
  assert(!result.context[0].sourceLabel.includes('还要'));
  const noPreview = createRecommendations({...base, threads: [{id: 'empty', name: null, preview: '', cwd: selectedCwd, updatedAt: now}]});
  assert.equal(noPreview.metadata.recentThreadCount, 0);
});

check('Archived, unrelated, old, future, engineering and wrong-project threads are excluded', () => {
  const rows = [
    {id: 'archived', title: '核对视频字幕', archived: true},
    {id: 'old', title: '核对视频字幕', updatedAt: now - 8 * 86400000},
    {id: 'future', title: '核对视频字幕', updatedAt: now + 3600000},
    {id: 'other', title: '核对视频字幕', cwd: '/Users/editor/Projects/other'},
    {id: 'unrelated', title: '完成凸优化作业'},
    {id: 'engineering', title: '部署视频剪辑 Agent 前端代码'},
    {id: 'private', title: '核对视频字幕', cwd: '/Users/editor/.codex/skills'},
    {id: 'missing-time', title: '核对视频字幕', updatedAt: null},
    {id: 'ephemeral', title: '核对视频字幕', ephemeral: true},
    {id: 'child', title: '核对视频字幕', parentThreadId: 'parent'},
    {id: 'guardian', title: '核对视频字幕', threadSource: 'guardian_review'},
    {id: 'memory', title: '核对视频字幕', threadSource: 'memory_consolidation'},
    {id: 'ambient', title: '核对视频字幕', threadSource: 'ambient_suggestions'},
    {id: 'subagent', title: '核对视频字幕', source: {subAgent: {other: 'helper'}}},
  ].map(row => ({cwd: selectedCwd, updatedAt: now - 1000, ...row}));
  const result = createRecommendations({...base, threads: rows});
  assertCards(result);
  assert.equal(result.metadata.recentThreadCount, 0);
  assert.equal(result.metadata.contextOrigin, 'project');
});

check('Files only qualify inside the explicitly selected project and use real metadata', () => {
  const result = createRecommendations({...base, files: [
    {name: '第01集.srt', path: `${selectedCwd}/字幕/第01集.srt`, modifiedAtMs: now - 1000, type: 'file'},
    {name: '剪辑需求.docx', path: '剪辑需求.docx', modifiedAtMs: now - 2000, type: 'file'},
    {name: '片段.mp4', path: '视频/片段.mp4', modifiedAtMs: now - 3000, type: 'file'},
    {name: 'outside.mp4', path: '/Users/editor/other/outside.mp4', modifiedAtMs: now},
    {name: 'folder.mp4', path: 'folder.mp4', isDirectory: true, modifiedAtMs: now},
  ]});
  assertCards(result);
  assert.equal(result.metadata.projectFileCount, 3);
  assert.equal(result.metadata.contextOrigin, 'file');
  assert.equal(result.context[0].sourceLabel, '第01集.srt');
  assert.equal(taskId(result.context[0]), 'subtitles');
  assert.equal(taskId(result.context[1]), 'focus');
  assert.equal(taskId(result.context[2]), 'inventory');
  assert.equal(result.context[0].sourceRef, `${selectedCwd}/字幕/第01集.srt`);
  assert.equal(result.context[1].sourceRef, `${selectedCwd}/剪辑需求.docx`);
  assert.equal(result.metadata.fileContextCount, 3);
  assert.equal(result.metadata.requiresFileContext, false);
  for (const card of result.context) {
    assert(card.sourceRef.startsWith(`${selectedCwd}/`));
    assert(card.prompt.includes(JSON.stringify(card.sourceRef)));
    assert(!card.prompt.includes('我已经理解'));
  }
});

check('Three newest unique files win over threads and duplicate path metadata keeps its newest timestamp', () => {
  const result = createRecommendations({...base,
    threads: [{id: 'recent-thread', title: '核对视频字幕断句', cwd: selectedCwd, updatedAt: now - 1}],
    files: [
      {path: '字幕.srt', modifiedAtMs: now - 9000},
      {path: '片段.mp4', modifiedAtMs: now - 2000},
      {path: '剪辑需求.docx', modifiedAtMs: now - 3000},
      {path: '字幕.srt', modifiedAtMs: now - 1000},
      {path: '封面.png', modifiedAtMs: now - 4000},
    ],
  });
  assertCards(result);
  assert.equal(result.metadata.projectFileCount, 4);
  assert.equal(result.metadata.fileContextCount, 3);
  assert.equal(result.metadata.requiresFileContext, false);
  assert.deepEqual(result.context.map(card => card.sourceKind), ['file', 'file', 'file']);
  assert.deepEqual(result.context.map(card => card.sourceRef), ['字幕.srt', '片段.mp4', '剪辑需求.docx'].map(name => `${selectedCwd}/${name}`));
});

check('Two distinct files stay first and a genuine recent thread fills only the third row', () => {
  const result = createRecommendations({...base,
    files: [{path: '第01集.srt', modifiedAtMs: now - 1000}, {path: '第02集.mp4', modifiedAtMs: now - 2000}],
    threads: [{id: 'recent-thread', title: '核对跨集人物关系', cwd: selectedCwd, updatedAt: now - 500}],
  });
  assertCards(result);
  assert.deepEqual(result.context.map(card => card.sourceKind), ['file', 'file', 'thread']);
  assert.notEqual(result.context[0].sourceRef, result.context[1].sourceRef);
  assert.equal(result.context[2].sourceRef, 'recent-thread');
});

check('Three files of the same format remain three independent sources', () => {
  const result = createRecommendations({...base, files: [1, 2, 3].map((n) => ({path: `第0${n}集.srt`, modifiedAtMs: now - n * 1000}))});
  assertCards(result);
  assert.equal(result.metadata.fileContextCount, 3);
  assert.deepEqual(result.context.map(card => card.sourceRef), [1, 2, 3].map(n => `${selectedCwd}/第0${n}集.srt`));
});

check('Metadata does not authorize home scans, temporary files, symlinks or environment files', () => {
  const paths = [
    '../private.mp4', '/tmp/素材.mp4', '/private/tmp/素材.mp4', '/private/var/folders/abc/素材.mp4',
    '.codex/素材.txt', '.ssh/素材.txt', '.aws/素材.txt', 'node_modules/字幕.srt', 'build/剧情.txt',
    'plugins/剧情.txt', 'codex-local/分析.txt', 'runtime-generations/素材.mp4', 'credentials.txt',
    'auth.txt', 'secret.txt', 'README.md', 'AGENTS.md', 'package.json', 'video.mp4/../other.mp4',
  ];
  const result = createRecommendations({...base, files: paths.map(name => ({path: name, modifiedAtMs: now - 1000}))});
  assert.equal(result.metadata.projectFileCount, 0);
  assert.equal(result.metadata.contextOrigin, 'project');
  const noScope = createRecommendations({...base, selectedCwd: undefined, files: [{path: `${selectedCwd}/视频.mp4`, modifiedAtMs: now}]});
  assert.equal(noScope.metadata.projectFileCount, 0);
  const symlink = createRecommendations({...base, files: [{path: '视频.mp4', modifiedAtMs: now, isSymlink: true}]});
  assert.equal(symlink.metadata.projectFileCount, 0);
  const blockedScope = createRecommendations({...base, selectedCwd: '/tmp/test', threads: [{id: 'other', title: '剪辑视频', cwd: selectedCwd, updatedAt: now}], files: []});
  assert.equal(blockedScope.metadata.recentThreadCount, 0);
});

check('Real file path spacing stays exact and directional-control paths are rejected', () => {
  const exactPath = `${selectedCwd}/交付  V2/人物  高光.mp4`;
  const result = createRecommendations({...base, files: [{path: exactPath, modifiedAtMs: now - 1000}]});
  assert.equal(result.metadata.projectFileCount, 1);
  assert.equal(result.context[0].sourceRef, exactPath);
  assert.equal(result.context[1].sourceKind, 'missing-file');
  assert.equal(result.context[1].sourceRef, '');
  assert.equal(result.metadata.fileContextCount, 1);
  const unsafe = createRecommendations({...base, files: [{path: `字幕\u202e.srt`, modifiedAtMs: now}]});
  assert.equal(unsafe.metadata.projectFileCount, 0);
  assert.equal(unsafe.metadata.requiresFileContext, true);
});

check('Display metadata is bounded and legacy product wording is not surfaced', () => {
  const result = createRecommendations({...base, threads: [{id: 'legacy', title: '先导片 · 人物关系核对 ChatGPT', cwd: selectedCwd, updatedAt: now - 1000}]});
  assertCards(result);
  assert(result.context[0].sourceLabel.includes('视频素材'));
  assert(!result.context[0].description.includes(result.context[0].sourceLabel));
  const long = createRecommendations({...base, threads: [{id: 'long', title: `视频字幕${'很长'.repeat(100)}`, cwd: selectedCwd, updatedAt: now - 1000}]});
  assert(long.context[0].sourceLabel.length <= 48);
});

check('Each opening rotates general tasks without reusing the previous six or current context', () => {
  const first = createRecommendations(base);
  const second = createRecommendations({...base, seed: 'opening-2', previousIds: first.previousIds});
  assertCards(second);
  const old = new Set(first.previousIds.map(taskId));
  assert(second.general.every(card => !old.has(taskId(card))));
  const sameSeed = createRecommendations(base);
  assert.deepEqual(first, sameSeed);
  const seedOnly = createRecommendations({...base, seed: 'different-opening'});
  assert.notDeepEqual(first.general.map(taskId), seedOnly.general.map(taskId));
});

check('Selections serialize without host objects and the selector does not touch host APIs', () => {
  const result = createRecommendations(base);
  assert.deepEqual(JSON.parse(serializeRecommendations(result)), result);
  assert(!/\b(?:localStorage|sessionStorage|fetch|XMLHttpRequest|require|window|document|process)\s*[.(]/.test(source));
  assert(!/from\s+['"](?:node:|fs|path|electron)/.test(source));
});

const report = {passed: checks.length, checks, catalogSize: catalog.length, runtimeMediaExecutionClaimed: false};
await fs.mkdir(path.join(root, 'verification'), {recursive: true});
await fs.writeFile(path.join(root, 'verification/recommendation-engine-verification.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
