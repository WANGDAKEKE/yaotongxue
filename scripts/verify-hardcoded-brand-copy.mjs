import fs from 'node:fs/promises';
import {vendorPath} from './paths.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {applyNativeVisibleCopy,nativeVisibleCopySourceFiles} from './native-visible-copy.mjs';
import {applyHardcodedBrandCopy, hardcodedBrandCopyPlan, hardcodedBrandSourceFiles} from './brand-hardcoded-copy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = vendorPath('extracted-app/webview/assets');
const output = path.join(root, 'build/hardcoded-brand-copy-verification.json');
const overlay = process.argv.includes('--overlay') ? path.join(root, 'build/ui-overlay/webview/assets') : null;
const sha = source => crypto.createHash('sha256').update(source).digest('hex');
const protectedLiterals = [
  '"ChatGPT-Account-ID"', '"ChatGPT-Account-Id"', 'origin_app_name',
  'https://chatgpt.com', 'assignedToChatGpt', 'sourceSearchText:',
  '/^@ChatGPT(?:\\s|$)/u', '`@ChatGPT ${e}`', '`chatgpt`',
  'lP=`ChatGPT`', '"OAI-App-Brand":lP.toLowerCase()',
  'brand_name:lP.toLowerCase()', 'lP===`ChatGPT`',
];
const reports = [];
for (const name of hardcodedBrandSourceFiles) {
  const original = await fs.readFile(path.join(vendor, name), 'utf8');
  const result = applyHardcodedBrandCopy(name, original);
  const plan = hardcodedBrandCopyPlan.filter(item => item.file === name);
  const spans = [];
  for (const [index, item] of plan.entries()) {
    assert.equal(original.split(item.from).length-1, item.expectedCount, item.name);
    for (let at = original.indexOf(item.from); at !== -1; at = original.indexOf(item.from, at + item.from.length)) {
      spans.push({at, end:at+item.from.length, item, marker:'__YAO_BRAND_DISPLAY_CHECKPOINT_' + index + '__'});
    }
  }
  spans.sort((a,b)=>a.at-b.at);
  let originalSkeleton = '', adaptedSkeleton = '', fromCursor = 0, toCursor = 0;
  for (const span of spans) {
    assert.ok(span.at >= fromCursor, 'Brand display checkpoints overlap: ' + name);
    const untouched = original.slice(fromCursor, span.at);
    assert.equal(result.source.slice(toCursor,toCursor+untouched.length), untouched,
      'Source changed outside audited display literals: ' + name);
    originalSkeleton += untouched + span.marker;
    adaptedSkeleton += result.source.slice(toCursor,toCursor+untouched.length) + span.marker;
    toCursor += untouched.length;
    assert.equal(result.source.slice(toCursor,toCursor+span.item.to.length),span.item.to,span.item.name);
    toCursor += span.item.to.length;
    fromCursor = span.end;
  }
  assert.equal(result.source.slice(toCursor), original.slice(fromCursor), 'Source tail changed: ' + name);
  originalSkeleton += original.slice(fromCursor);
  adaptedSkeleton += result.source.slice(toCursor);
  assert.equal(adaptedSkeleton, originalSkeleton, 'Only audited display literals may change: ' + name);
  for (const literal of protectedLiterals) {
    assert.equal(result.source.split(literal).length, original.split(literal).length,
      'Protocol/auth/search/mention literal changed: ' + name + ' ' + literal);
  }
  assert.equal(spawnSync(process.execPath, ['--check', '--input-type=module'], {
    input:result.source, encoding:'utf8', maxBuffer:1024*1024,
  }).status, 0, 'Adapted source syntax: ' + name);
  if (overlay) {
    const packedSource = await fs.readFile(path.join(overlay, name), 'utf8');
    const expectedTargets = new Map();
    for (const item of plan) {
      assert.equal(packedSource.includes(item.from), false, 'Old live display checkpoint remains: ' + item.name);
      expectedTargets.set(item.to,(expectedTargets.get(item.to)??0)+item.expectedCount);
    }
    for (const [target,count] of expectedTargets) {
      assert.equal(packedSource.split(target).length-1, count, 'Built display checkpoint missing: ' + name + ' ' + target);
    }
  }
  reports.push({file:name, changes:result.changes, unchangedSourceSkeletonSha256:sha(originalSkeleton),
    protectedProtocolAuthSearchAndMentionLiteralsRetained:true, syntaxPassed:true, overlayChecked:Boolean(overlay)});
}
const modeWordmarks = [];
for (const item of hardcodedBrandCopyPlan.filter(item => item.name.startsWith('sidebar-visible-'))) {
  const runtime = item.to.match(/=e=>\(0,([^.]*)\.jsx\)/)[1];
  const jsx = (type, props) => ({type,props});
  const factory = vm.runInNewContext('(' + item.to.slice(item.to.indexOf('=') + 1) + ')', {[runtime]:{jsx}});
  const onClick = () => {};
  const element = factory({className:'h-[1em] w-auto',onClick,'aria-hidden':'true'});
  const text = element.props.children;
  assert.equal(element.type,'svg');
  assert.equal(text.type,'text');
  assert.equal(element.props.width,Number(item.from.match(/width:([^,]*)/)[1]));
  assert.equal(element.props.height,18);
  assert.equal(element.props.viewBox,item.from.match(/viewBox:`([^`]*)`/)[1]);
  assert.equal(element.props.onClick,onClick);
  assert.equal(element.props.className,'h-[1em] w-auto');
  assert.equal(element.props['aria-hidden'],'true');
  assert.equal(element.props['aria-label'],text.props.children);
  assert.ok(['视频工作','视频助手'].includes(text.props.children));
  assert.equal(text.props.fill,'currentColor');
  assert.equal(text.props.dominantBaseline,'central');
  assert.ok(text.props.fontSize * Array.from(text.props.children).length <= element.props.width,
    'Chinese text fits the original SVG width: ' + item.name);
  assert.ok(text.props.y - text.props.fontSize / 2 >= 0 && text.props.y + text.props.fontSize / 2 <= 18,
    'Chinese text fits the original SVG height: ' + item.name);
  modeWordmarks.push({checkpoint:item.name,label:text.props.children,rootDimensionsPreserved:true,
    callerPropsAndEventsPreserved:true,textFitsOriginalViewBox:true,accessibleLabelUpdated:true});
}
const nativeReports=[];
for (const name of nativeVisibleCopySourceFiles) {
  const original=await fs.readFile(path.join(vendor,'../../',name),'utf8');
  const adapted=applyNativeVisibleCopy(name,original);
  assert.ok(adapted.changes.length > 0,'Native source was adapted: ' + name);
  assert.equal(applyNativeVisibleCopy(name,adapted.source).source,adapted.source,'Native replay stable: ' + name);
  assert.equal(spawnSync(process.execPath,['--check','--input-type=module'],{input:adapted.source,
    encoding:'utf8',maxBuffer:1024*1024}).status,0,'Native source syntax: ' + name);
  for (const literal of protectedLiterals) assert.equal(adapted.source.split(literal).length,
    original.split(literal).length,'Native protocol and auth literals retained: ' + name + ' ' + literal);
  nativeReports.push({file:name,changes:adapted.changes,syntaxPassed:true,repeatedBuildStable:true});
}
const nativeLocaleRoot=path.join(vendor,'../../native-menu-locales');
for (const name of (await fs.readdir(nativeLocaleRoot)).filter(name=>name.endsWith('.json'))) {
  const original=await fs.readFile(path.join(nativeLocaleRoot,name),'utf8');
  const result=applyNativeVisibleCopy('native-menu-locales/'+name,original);
  const before=JSON.parse(original),after=JSON.parse(result.source);
  assert.deepEqual(Object.keys(after),Object.keys(before),'Native locale message IDs retained: '+name);
  for (const [key,value] of Object.entries(after)) {
    assert.equal(typeof value,typeof before[key]);
    if (typeof value==='string') assert.equal(/ChatGPT|\bCodex\b/.test(value),false,'Old native display brand: '+name+' '+key);
  }
  nativeReports.push({file:'native-menu-locales/'+name,changes:result.changes,messageIdsPreserved:true});
}
assert.equal(applyHardcodedBrandCopy('unrelated.js', 'const title=`ChatGPT`;').source, 'const title=`ChatGPT`;');
assert.throws(() => applyHardcodedBrandCopy(hardcodedBrandSourceFiles[0], ''), /checkpoint changed/);
await fs.mkdir(path.dirname(output), {recursive:true});
await fs.writeFile(output, JSON.stringify({verifiedAt:new Date().toISOString(),
  files:reports.length, checkpoints:hardcodedBrandCopyPlan.length,
  replacements:reports.flatMap(report=>report.changes).reduce((sum,item)=>sum+item.count,0),
  sourceSkeletonsUnchanged:true, apiAuthSearchAndMentionSerializationUnchanged:true,
  onlyAuditedModeWordmarkLeavesChanged:true, otherSvgLeafBytesRetained:true, unrelatedSourceUnchanged:true, modeWordmarks,nativeReports, reports}, null, 2) + '\n');
console.log('Hardcoded brand display verification passed: ' + reports.length + ' files / ' + hardcodedBrandCopyPlan.length + ' checkpoints.');
