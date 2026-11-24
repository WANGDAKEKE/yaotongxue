// Visible native-shell branding only. Technical identifiers, auth, providers,
// protocols, paths, IPC methods and vendor copyright notices stay untouched.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mainFile = '.vite/build/main-JI9qDiXp.js';
const startupFile = '.vite/build/startup-requirements-noLGSvyx.js';
const bootstrapFile = '.vite/build/bootstrap-DCRTDDSX.js';
const commandFiles = ['.vite/build/src-CsH31EEu.js', '.vite/build/worker.js'];
const themeFile = '.vite/build/src-CSKkIr_z.js';
export const nativeVisibleCopySourceFiles = [mainFile, startupFile, bootstrapFile, ...commandFiles, themeFile];

const quoted = text => '`' + text + '`';
const remoteCopy = new Map([
  ["ChatGPT couldn't finish remote setup", '姚同学未能完成远程配置'],
  ['ChatGPT could not find these SSH aliases after checking SSH config:', 'SSH 配置中找不到以下主机：'],
  ["ChatGPT couldn't find remote setup config", '找不到远程配置'],
  ['ChatGPT could not find the setup config file.', '找不到配置文件。'],
  ["ChatGPT couldn't read remote setup config", '无法读取远程配置'],
  ['ChatGPT could not read the setup config file.', '无法读取配置文件。'],
  ["ChatGPT couldn't apply remote setup config", '远程配置未能生效'],
  ['Setup config version ${e.version} is not supported by this version of ChatGPT.', '当前版本不支持配置版本 ${e.version}。'],
  ['The setup config file does not match the format ChatGPT expects.', '配置文件格式有误，请检查后重试。'],
  ['ChatGPT hit an unexpected error while applying the setup config.', '应用配置失败，请检查后重试。'],
]);
const startupCopy = new Map([
  ['ChatGPT configuration could not be loaded', '无法加载姚同学的配置'],
  ['ChatGPT cannot start until its configuration is fixed. Open the file below, fix the reported issue, save it, then choose Retry. If your organization manages this file, contact your IT administrator.{paragraphBreak}{location}{lineBreak}{detail}',
    '请打开下方文件，修复问题并保存，再点击“重试”。如果文件由团队管理，请联系管理员。{paragraphBreak}{location}{lineBreak}{detail}'],
  ['ChatGPT cannot start until its configuration is fixed. Check config.toml in the app’s configuration folder for the issue below, save your changes, then choose Retry. If you cannot find the setting or your organization manages it, contact your IT administrator.{paragraphBreak}{detail}',
    '请检查应用配置文件夹中的 config.toml，修复问题并保存，再点击“重试”。找不到设置时，请联系管理员。{paragraphBreak}{detail}'],
]);
const nativeChineseMenuCopy = {
  'codex.aboutDialog.versionLineWithDate': '版本 {version}，发布于 {releaseDate}',
  'codex.command.newProject': '新建素材项目',
  'codex.commandMenuTitle.newProject': '新建素材项目…',
  'codex.command.newThread': '新建对话',
  'codex.commandMenuTitle.newThread': '新建对话',
  'codex.command.newProjectlessTask': '新建独立任务',
  'codex.commandMenuTitle.newProjectlessTask': '新建独立任务',
  'desktop.workspacePolicyRecovery.configTitle': '无法加载姚同学的配置',
  'desktop.workspacePolicyRecovery.configDetailWithLocation': '请打开下方文件，修复问题并保存，再点击“重试”。如果文件由团队管理，请联系管理员。{paragraphBreak}{location}{lineBreak}{detail}',
  'desktop.workspacePolicyRecovery.configDetailWithoutLocation': '请检查应用配置文件夹中的 config.toml，修复问题并保存，再点击“重试”。找不到设置时，请联系管理员。{paragraphBreak}{detail}',
};
const commandCopy = new Map([
  ['Implement with Codex', '交给姚同学处理'],
  ['Open Codex Sidebar', '打开姚同学侧边栏'],
  ['New Codex Agent', '新建视频剪辑 Agent'],
  ['Add to Codex Chat', '添加到姚同学对话'],
  ['Add File to Codex Chat', '添加文件到姚同学对话'],
  ['Copy Codex CLI args for LSP MCP', '复制剪辑引擎的 LSP MCP 参数'],
  ['New Chat in ChatGPT Sidebar', '在姚同学侧边栏新建对话'],
]);

export function applyNativeVisibleCopy(relativeName, source) {
  const name = relativeName.replaceAll('\\', '/');
  const changes = [];
  function replace(before, after, label, expected) {
    const count = source.split(before).length - 1;
    if (count === 0 && source.includes(after)) return; // Safe repeated build.
    if (count === 0 || (expected != null && count !== expected)) {
      throw new Error(`Native visible copy checkpoint changed: ${name}: ${label} (${count})`);
    }
    source = source.split(before).join(after);
    changes.push({ label, count });
  }
  if (name === mainFile) {
    replace(quoted('ChatGPT is using your computer'), quoted('姚同学正在协助你操作电脑'), 'Computer-use status', 1);
    replace(quoted('Return Picture-in-Picture to ChatGPT'), quoted('将画中画移回姚同学'), 'Picture-in-picture tooltip', 1);
    replace('values:{appName:`ChatGPT`}', 'values:{appName:`姚同学`}', 'Native app-name interpolation', 4);
    replace(quoted('Powered by Codex & OWL'), quoted('姚同学，腾讯视频的视频剪辑 Agent'), 'About product line', 1);
    replace(quoted('ChatGPT is still starting'), quoted('姚同学正在准备剪辑工作台'), 'Startup progress title', 1);
    replace('title:`ChatGPT App Tools`', 'title:`姚同学工具`', 'Visible tool catalog title', 1);
    replace(quoted('Codex rebuilt its local database.'), quoted('姚同学已重新整理本地对话记录。'), 'Database recovery notice', 1);
    for (const [before, after] of remoteCopy) replace(quoted(before), quoted(after), 'Remote setup dialog text');
  } else if (name === startupFile) {
    for (const [before, after] of startupCopy) replace(quoted(before), quoted(after), 'Configuration recovery dialog', 1);
  } else if (name === bootstrapFile) {
    replace('displayName:`ChatGPT Skill`', 'displayName:`姚同学工作流技能`', 'File-open type display name', 1);
    replace('defaultMessage:`Codex will record the first two minutes after restarting and save a trace on this computer. It may contain private information such as file paths and chat names. Nothing is uploaded automatically.`',
      'defaultMessage:`姚同学将在重启后记录前两分钟的性能跟踪并保存在这台电脑上，可能包含文件路径和对话名称等信息，不会自动上传。`', 'Native performance trace consent', 1);
  } else if (commandFiles.includes(name)) {
    for (const [before, after] of commandCopy) replace('title:' + quoted(before), 'title:' + quoted(after), 'Visible shortcut command title', 1);
    if (name.endsWith('/worker.js')) replace('[gF.CODEX]:{label:`Codex`', '[gF.CODEX]:{label:`姚同学`', 'Default theme display label', 1);
  } else if (name === themeFile) {
    replace('[q.CODEX]:{label:`Codex`', '[q.CODEX]:{label:`姚同学`', 'Default theme display label', 1);
  } else if (/^native-menu-locales\/[^/]+\.json$/.test(name)) {
    const parsed = JSON.parse(source);
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'string' || !/ChatGPT|\bCodex\b/.test(value)) continue;
      parsed[key] = value.replaceAll('ChatGPT', '姚同学').replace(/\bCodex\b/g, '姚同学');
      changes.push({ label: 'Localized native visible text', messageId: key, count: 1 });
    }
    if (name === 'native-menu-locales/zh-CN.json') {
      for (const [key, value] of Object.entries(nativeChineseMenuCopy)) {
        if (typeof parsed[key] !== 'string') throw new Error('Native Chinese display checkpoint changed: ' + key);
        if (parsed[key] === value) continue;
        parsed[key] = value;
        changes.push({ label: 'Short Chinese material-work text', messageId: key, count: 1 });
      }
    }
    if (changes.length) source = JSON.stringify(parsed) + '\n';
  }
  return { source, changes };
}

// Called only on the staged, project-owned app BEFORE the existing deep signing
// step. Do not apply this to the official app or independently signed tools.
export async function applyNativeVisibleResources(appRoot) {
  const resolved = path.resolve(appRoot);
  const relative = path.relative(projectRoot, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || !resolved.endsWith('.app')) {
    throw new Error('Native visible resources require a project-owned staged app');
  }
  const report = [];
  const plistScript = String.raw`import json,plistlib,sys
p=sys.argv[1]; mode=sys.argv[2]
d=plistlib.load(open(p,'rb')); before=json.loads(json.dumps(d)); changed=[]
if mode=='outer':
    for k in ['CFBundleName','CFBundleDisplayName','CFBundleGetInfoString']:
        if k in d and isinstance(d[k],str):
            d[k]=d[k].replace('ChatGPT','姚同学').replace('Codex','姚同学')
    d['CFBundleAlternateNames']=['姚同学']
    d['MDItemKeywords']=['姚同学','腾讯视频','视频剪辑','素材生产','Agent']
    for k,v in list(d.items()):
        if k.startswith('NS') and k.endswith('UsageDescription') and isinstance(v,str):
            d[k]=v.replace('ChatGPT','姚同学')
    for t in d.get('CFBundleDocumentTypes',[]):
        if t.get('CFBundleTypeName')=='ChatGPT Skill': t['CFBundleTypeName']='姚同学工作流技能'
    for t in d.get('UTExportedTypeDeclarations',[]):
        if t.get('UTTypeDescription')=='ChatGPT Skill': t['UTTypeDescription']='姚同学工作流技能'
elif mode=='helper':
    for k in ['CFBundleDisplayName','CFBundleName']:
        if k in d: d[k]='姚同学'
else: raise RuntimeError('Unexpected native resource mode')
for k,v in d.items():
    if before.get(k)!=v: changed.append(k)
if changed: plistlib.dump(d,open(p,'wb'),fmt=plistlib.FMT_BINARY)
print(json.dumps(changed))`;
  function patchPlist(file, mode) {
    const keys = JSON.parse(execFileSync('/usr/bin/python3', ['-c', plistScript, file, mode], { encoding: 'utf8' }));
    if (keys.length) report.push({ file: path.relative(resolved, file), kind: 'visible plist values', keys });
  }
  patchPlist(path.join(resolved, 'Contents/Info.plist'), 'outer');
  const resources = path.join(resolved, 'Contents/Resources');
  for (const dir of await fs.readdir(resources, { withFileTypes: true })) {
    if (!dir.isDirectory() || !dir.name.endsWith('.lproj')) continue;
    const file = path.join(resources, dir.name, 'InfoPlist.strings');
    let source;
    try { source = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    // These OpenStep .strings have no branded keys. Replace only quoted values.
    const matches = [...source.matchAll(/=\s*"((?:\\.|[^"\\])*)"\s*;/g)];
    let count = 0;
    for (const match of matches) {
      if (!match[1].includes('ChatGPT')) continue;
      source = source.replace(match[0], match[0].replaceAll('ChatGPT', '姚同学'));
      count++;
    }
    if (count) { await fs.writeFile(file, source); report.push({ file: path.relative(resolved, file), kind: 'localized permission and app text', count }); }
  }
  const helperRoot = path.join(resolved, 'Contents/Frameworks/Codex Framework.framework/Versions/155.0.8059.80/Helpers');
  for (const dir of await fs.readdir(helperRoot, { withFileTypes: true })) {
    if (!dir.isDirectory() || !dir.name.endsWith('.app')) continue;
    const helper = path.join(helperRoot, dir.name);
    patchPlist(path.join(helper, 'Contents/Info.plist'), 'helper');
    const stringsFile = path.join(helper, 'Contents/Resources/base.lproj/InfoPlist.strings');
    try {
      const value = JSON.parse(execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', stringsFile], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
      if (value.CFBundleDisplayName === 'Codex') {
        value.CFBundleDisplayName = '姚同学';
        execFileSync('/usr/bin/python3', ['-c', 'import json,plistlib,sys; plistlib.dump(json.loads(sys.argv[2]),open(sys.argv[1],"wb"),fmt=plistlib.FMT_BINARY)', stringsFile, JSON.stringify(value)]);
        report.push({ file: path.relative(resolved, stringsFile), kind: 'notification helper localized display name', keys: ['CFBundleDisplayName'] });
      }
    } catch (error) {
      try { await fs.access(stringsFile); } catch (missing) { if (missing.code === 'ENOENT') continue; throw missing; }
      throw error;
    }
  }
  return report;
}

export const nativeVisibleCopyScope = {
  productName: '姚同学',
  productDescription: '腾讯视频的视频剪辑 Agent',
  preserved: ['authentication', 'provider and model identifiers', 'URLs and protocol schemes', 'IPC identifiers', 'telemetry identifiers', 'vendor copyright', 'independently signed CLI and computer-use tools'],
  resourceSigning: 'Outer app, Framework and its eight existing helpers must be signed after resource patching.',
};
