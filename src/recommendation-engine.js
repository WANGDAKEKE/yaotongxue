// Pure metadata-only recommendation selection. This module never opens files,
// reads storage, calls a model, or changes a conversation. Source metadata is
// untrusted context, never instructions and never evidence of file contents.

const YAO_RELATED_WORK = /视频|剪辑|剪映|素材|物料|剧集|剧本|字幕|分镜|台词|人物关系|宣发|预告|花絮|混剪|演员|镜头|后期|腾讯视频|先导片|trailer|rough\s?cut|storyboard|subtitle|timeline|video\s?edit|\.srt\b|\.vtt\b/i;
const YAO_ENGINEERING_WORK = /源码|代码|仓库|部署|打包|构建|前端|后端|依赖|安装|服务器|数据库迁移|electron|app\.asar|node_modules|package\.json|debug|bug\b|localhost|127\.0\.0\.1/i;
const YAO_BLOCKED_SEGMENTS = /^(?:\.[^/]*|node_modules|vendor|plugins?|dist|build|coverage|__pycache__|venv|env|target|Library|Applications|official-desktop|upstream|tooling|codex-local|artifact-sessions|runtime-generations)$/i;
const YAO_PRIVATE_FILE = /(?:^|[._-])(?:secrets?|tokens?|passwords?|passwd|credentials?|cookies?|auth|id_rsa|id_ed25519)(?:[._-]|$)/i;
const YAO_ENGINEERING_FILE = /^(?:package(?:-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|readme(?:\.[^.]+)?|agents\.md|skill\.md|tsconfig(?:\.[^.]+)?\.json|vite\.config\.[^.]+|dockerfile|license(?:\.[^.]+)?)$/i;
const YAO_MEDIA_EXTS = new Set(['mp4', 'mov', 'mkv', 'm4v', 'webm', 'avi', 'mxf', 'mts']);
const YAO_AUDIO_EXTS = new Set(['wav', 'mp3', 'aac', 'm4a', 'flac', 'aif', 'aiff']);
const YAO_TEXT_EXTS = new Set(['txt', 'doc', 'docx', 'pdf', 'rtf', 'md']);
const YAO_IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'heic']);
const YAO_CONTEXT_SENTENCES = {
  hook: '从现有素材里挑三个开场，比较冲突和反差的吸引力',
  focus: '提炼适合拆成短视频的剧情看点',
  brief: '整理这次剪辑的素材范围、画幅和交付要求',
  inventory: '核对视频、字幕和剧本的配套关系，补齐素材目录',
  clips: '把可用片段整理成表，保留台词、人物和来源',
  story: '理顺短视频的故事主线，让新观众也能看懂',
  relationship: '核对跨集的人物关系，避免接错身份和剧情阶段',
  arc: '梳理人物的关键选择，用行动串起变化和高光',
  actor: '整理表演高光，留住眼神、动作和情绪的完整表达',
  opener: '试两个不同的开头，比较冲突和人物反差怎么接',
  pacing: '找出重复和拖沓的段落，把情绪节奏再接顺一点',
  cut: '回看台词、动作和反应镜头，核对每处剪口',
  cards: '核对字卡与前后镜头，让连接句接得更自然',
  subtitles: '核对字幕断句和人物称呼，让手机阅读更轻松',
  audio: '检查对白和配乐，找出遮挡、跳音和衔接问题',
  vertical: '检查竖屏构图，把人物、动作和字幕留完整',
  ending: '检查结尾的因果和人物引入，留下清楚的悬念',
  variants: '用同一组素材规划三版，分别突出人物、冲突和情绪',
  compare: '对比两个剪辑版本，挑出值得保留和合并的段落',
  cover: '对齐片中看点，整理几组简短的封面标题',
  delivery: '核对视频、字幕、封面和版本，整理这次的交付表',
};

function yaoPlain(value, limit = 180) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function yaoDisplay(value, limit = 48) {
  return yaoPlain(value, limit).replace(/先导片/g, '视频素材').replace(/ChatGPT Work/gi, '视频工作').replace(/ChatGPT/gi, '视频助手').replace(/\s*[·•]\s*/g, ' ');
}

function yaoPath(value) {
  if (typeof value !== 'string' || value.length > 4096 || /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/.test(value)) return '';
  // Paths are identifiers, so repeated spaces must remain exact. Display text
  // is normalized separately and is never fed back into a filesystem lookup.
  const raw = value.replace(/\\/g, '/').replace(/\/+$/, '');
  if (!raw || raw.split('/').includes('..')) return '';
  return raw;
}

function yaoSafePath(value) {
  const normalized = yaoPath(value);
  if (!normalized || /^(?:\/private)?\/tmp(?:\/|$)|^\/var\/tmp(?:\/|$)|^\/private\/var\/folders(?:\/|$)/i.test(normalized)) return '';
  if (normalized.split('/').filter(Boolean).some(part => YAO_BLOCKED_SEGMENTS.test(part))) return '';
  return normalized;
}

function yaoTimestamp(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value)) return Date.parse(value) || 0;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? (number < 1e12 ? number * 1000 : number) : 0;
}

function yaoHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function yaoShuffle(values, seed) {
  let state = yaoHash(seed);
  const random = () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function yaoTaskIds(value) {
  if (/字幕|\.srt\b|\.vtt\b|subtitle/i.test(value)) return ['subtitles', 'cut', 'delivery'];
  if (/配乐|音轨|音频|对白|音量|audio|\.wav\b|\.mp3\b/i.test(value)) return ['audio', 'pacing', 'cut'];
  if (/演员|表演|高光/i.test(value)) return ['actor', 'arc', 'relationship'];
  if (/人物|角色|关系|童年|成年|时间线/i.test(value)) return ['relationship', 'story', 'cards'];
  if (/字卡|大字|连接句/i.test(value)) return ['cards', 'story', 'ending'];
  if (/封面|标题|文案/i.test(value)) return ['cover', 'focus', 'opener'];
  if (/交付|版本|导出|成片|复核/i.test(value)) return ['delivery', 'compare', 'pacing'];
  if (/开场|钩子|冲突|反差/i.test(value)) return ['hook', 'opener', 'story'];
  if (/竖屏|画幅|构图/i.test(value)) return ['vertical', 'pacing', 'delivery'];
  if (/剪口|镜头|剪辑|节奏/i.test(value)) return ['pacing', 'cut', 'clips'];
  return ['clips', 'focus', 'story'];
}

function yaoNormalizeThreads(rows, selectedCwd, now) {
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).flatMap(row => {
    if (!row || row.archived || row.isArchived || row.is_archived || row.archivedAt || row.archived_at || row.status === 'archived' || row.source === 'system' || row.isSubagent || row.is_subagent) return [];
    const threadSource = row.threadSource ?? row.thread_source;
    if (row.ephemeral || row.parentThreadId || row.parent_thread_id || ['subagent', 'guardian_review', 'memory_consolidation', 'ambient_suggestions'].includes(threadSource)) return [];
    if ((typeof row.source === 'string' && /^subagent/i.test(row.source)) || (row.source && typeof row.source === 'object' && ('subAgent' in row.source || 'sub_agent' in row.source))) return [];
    const cwd = yaoSafePath(row.cwd ?? row.workingDirectory ?? row.working_directory ?? row.projectPath);
    if (!cwd || (selectedCwd && cwd !== selectedCwd)) return [];
    const preview = yaoPlain(row.preview ?? row.summary ?? row.lastMessage ?? row.last_message, 700);
    const title = yaoPlain(row.title ?? row.name, 180) || yaoPlain(preview.split(/[。！？!?]/u)[0], 180);
    const text = `${title} ${preview}`;
    if (!title || !YAO_RELATED_WORK.test(text) || YAO_ENGINEERING_WORK.test(title)) return [];
    const updatedAt = yaoTimestamp(row.updatedAt ?? row.updated_at ?? row.lastActiveAt ?? row.last_active_at);
    if (!updatedAt || updatedAt > now + 300000 || now - updatedAt > 7 * 86400000) return [];
    const id = yaoPlain(row.id ?? row.threadId ?? row.thread_id, 200);
    const key = id || `${cwd}:${title}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{kind: 'thread', ref: id || `title:${yaoHash(key)}`, label: yaoDisplay(title), title: yaoDisplay(title), text, cwd, updatedAt}];
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}

function yaoNormalizeFiles(rows, selectedCwd, now) {
  if (!selectedCwd) return [];
  const seen = new Set();
  return (Array.isArray(rows) ? rows : []).flatMap(row => {
    if (!row || row.isDirectory || row.is_directory || row.type === 'directory' || row.isSymlink || row.is_symlink) return [];
    const declaredCwd = yaoPath(row.cwd ?? row.projectPath ?? row.project_path);
    if (declaredCwd && declaredCwd !== selectedCwd) return [];
    const raw = yaoPath(row.path ?? row.relativePath ?? row.relative_path ?? row.name);
    if (!raw) return [];
    const fullPath = yaoSafePath(raw.startsWith('/') ? raw : `${selectedCwd}/${raw}`);
    if (!fullPath || !fullPath.startsWith(`${selectedCwd}/`)) return [];
    const name = fullPath.split('/').at(-1);
    if (!name || YAO_PRIVATE_FILE.test(name) || YAO_ENGINEERING_FILE.test(name)) return [];
    const extension = (name.includes('.') ? name.split('.').at(-1) : yaoPlain(row.ext ?? row.extension).replace(/^\./, '')).toLowerCase();
    const known = YAO_MEDIA_EXTS.has(extension) || YAO_AUDIO_EXTS.has(extension) || YAO_TEXT_EXTS.has(extension) || YAO_IMAGE_EXTS.has(extension) || ['srt', 'vtt', 'ass', 'csv', 'xlsx'].includes(extension);
    if (!known || (extension === 'md' && !YAO_RELATED_WORK.test(name)) || YAO_ENGINEERING_WORK.test(name)) return [];
    const updatedAt = yaoTimestamp(row.modifiedAtMs ?? row.mtimeMs ?? row.mtime ?? row.modifiedAt ?? row.modified_at ?? row.updatedAt ?? row.updated_at ?? row.lastOpenedAt ?? row.last_opened_at);
    if (!updatedAt || updatedAt > now + 300000) return [];
    let taskIds;
    if (['srt', 'vtt', 'ass'].includes(extension)) taskIds = ['subtitles', 'cut', 'delivery'];
    else if (YAO_MEDIA_EXTS.has(extension)) taskIds = ['inventory', 'vertical', 'pacing'];
    else if (YAO_AUDIO_EXTS.has(extension)) taskIds = ['audio', 'cut', 'pacing'];
    else if (YAO_IMAGE_EXTS.has(extension)) taskIds = ['cover', 'delivery', 'inventory'];
    else if (['csv', 'xlsx'].includes(extension)) taskIds = ['delivery', 'inventory', 'clips'];
    else taskIds = ['focus', 'relationship', 'clips'];
    return [{kind: 'file', ref: fullPath, label: yaoDisplay(name, 56), title: yaoDisplay(name, 56), text: name, cwd: selectedCwd, updatedAt, taskIds}];
  }).sort((a, b) => b.updatedAt - a.updatedAt).filter(row => {
    // Multiple bridges can report the same path; retain its newest metadata.
    if (seen.has(row.ref)) return false;
    seen.add(row.ref);
    return true;
  });
}

function yaoContextCard(task, source) {
  const locator = source.kind === 'thread' ? `对话标题：${JSON.stringify(source.title)}。` : `文件：${JSON.stringify(source.ref)}。`;
  const start = source.kind === 'thread'
    ? '请先查看这次对话和已有材料，再继续下面的工作。'
    : '请先打开这个项目文件，再完成下面的工作。';
  return {
    id: `context:${source.kind}:${yaoHash(source.ref)}::${task.id}`,
    title: YAO_CONTEXT_SENTENCES[task.id] ?? task.description,
    description: task.description,
    prompt: `${start}\n${locator}\n${task.prompt}\n如果文件或对话无法打开，先告诉我缺哪份材料。`,
    sourceKind: source.kind,
    sourceLabel: source.label,
    sourceRef: source.ref,
  };
}

function yaoPreviousTaskId(value) {
  const text = typeof value === 'object' && value !== null ? value.id : value;
  return String(text ?? '').split('::').at(-1).replace(/^general:/, '');
}

/**
 * @param {object} options Metadata supplied by the app's existing project bridge.
 * @param {Array|{tasks:Array}} options.catalog The checked-in professional task pool.
 * @param {Array} [options.threads] User conversation metadata, not message bodies.
 * @param {Array} [options.files] Metadata inside the explicitly selected project only.
 * @param {string} [options.selectedCwd] Selected project's absolute directory.
 * @param {number|string|Date} options.now Current clock supplied by caller.
 * @param {string|number} [options.seed] A launch/session seed supplied by caller.
 * @param {Array<string>} [options.previousIds] Last opening's result IDs.
 * @returns {{context:Array, general:Array, previousIds:Array, metadata:object}}
 */
export function createRecommendations(options = {}) {
  const rawCatalog = Array.isArray(options.catalog) ? options.catalog : options.catalog?.tasks;
  const catalog = (rawCatalog ?? []).filter(task => task && /^[a-z][a-z0-9-]*$/.test(task.id) && task.title && task.description && task.prompt);
  const byId = new Map(catalog.map(task => [task.id, task]));
  if (byId.size < 9) throw new Error('Recommendation catalog requires at least nine unique tasks.');
  const now = yaoTimestamp(options.now);
  const selectedCwd = yaoSafePath(options.selectedCwd);
  // An explicitly supplied unsafe project is never replaced with another project.
  const scopeBlocked = Boolean(options.selectedCwd && !selectedCwd);
  const threads = scopeBlocked || !now ? [] : yaoNormalizeThreads(options.threads, selectedCwd, now);
  const files = scopeBlocked || !now ? [] : yaoNormalizeFiles(options.files, selectedCwd, now);
  const context = [];
  const contextTaskIds = new Set();
  const contextSources = new Set();
  const addSource = source => {
    const sourceKey = source && `${source.kind}:${source.ref}`;
    if (!source || contextSources.has(sourceKey)) return false;
    const candidates = source.taskIds ?? yaoTaskIds(source.text);
    const taskId = candidates.find(id => byId.has(id) && !contextTaskIds.has(id));
    if (!taskId) return false;
    contextTaskIds.add(taskId);
    contextSources.add(sourceKey);
    context.push(yaoContextCard(byId.get(taskId), source));
    return true;
  };
  // Each contextual row uses a different genuine source. Prefer the newest
  // three project files, then recent conversations; never reuse a file.
  for (const source of [...files, ...threads]) {
    if (context.length >= 3) break;
    addSource(source);
  }
  // Missing input remains explicit instead of inventing a recent file.
  const missingIds = ['inventory', 'focus', 'brief', 'clips', 'delivery', 'story'];
  for (const taskId of missingIds) {
    if (context.length >= 3) break;
    if (!byId.has(taskId) || contextTaskIds.has(taskId)) continue;
    const task = byId.get(taskId);
    contextTaskIds.add(taskId);
    const missingTitles = {
      inventory: '提供视频或字幕，我来整理素材清单',
      focus: '补充剧本或剪辑需求，再提炼短视频看点',
      brief: '提供剪辑需求，先确认画幅、时长和交付版本',
    };
    context.push({
      id: `context:missing-file::${taskId}`,
      title: missingTitles[taskId] ?? YAO_CONTEXT_SENTENCES[taskId] ?? task.description,
      description: '先提供当前项目的素材文件。',
      prompt: `当前没有拿到足够的独立项目材料。请先让我选择或提供当前项目的素材，确认可以访问后再处理以下任务。不能虚构最近文件，不要扫描其他目录。\n${task.prompt}`,
      sourceKind: 'missing-file',
      sourceLabel: '需要项目素材',
      sourceRef: '',
    });
  }
  const previous = new Set((Array.isArray(options.previousIds) ? options.previousIds : []).map(yaoPreviousTaskId));
  const available = catalog.filter(task => !contextTaskIds.has(task.id));
  const seed = String(options.seed ?? now);
  const fresh = yaoShuffle(available.filter(task => !previous.has(task.id)), seed);
  const recycled = yaoShuffle(available.filter(task => previous.has(task.id)), `${seed}:recycled`);
  const general = [...fresh, ...recycled].slice(0, 3).map(task => ({
    id: `general:${task.id}`,
    title: task.suggestion || task.title,
    description: task.description,
    prompt: `先检查当前项目材料，只根据实际可访问的文件、对话和媒体执行。\n${task.prompt}`,
    sourceKind: 'general',
    sourceLabel: '通用任务',
    sourceRef: task.id,
  }));
  return {
    context,
    general,
    previousIds: [...context, ...general].map(card => card.id),
    metadata: {
      contextOrigin: files.length ? 'file' : threads.length ? 'thread' : 'project',
      recentThreadCount: threads.length,
      projectFileCount: files.length,
      fileContextCount: context.filter(card => card.sourceKind === 'file').length,
      requiresFileContext: context.filter(card => card.sourceKind === 'file').length < 3,
    },
  };
}

export function serializeRecommendations(result) {
  return JSON.stringify(result);
}
