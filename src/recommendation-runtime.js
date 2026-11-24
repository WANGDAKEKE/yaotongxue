// Home-only presentation and metadata adapter. Uses the official React/runtime,
// route scope, selected project state and app-server request bridge. No file
// contents, account storage, model requests or terminal execution are involved.
const YAO_REC_STORAGE_KEY = 'yaotongxue:home-recommendations:v1';
const YAO_REC_MEDIA_EXT = /\.(?:mp4|mov|mkv|m4v|webm|avi|mxf|mts|wav|mp3|aac|m4a|flac|aif|aiff|srt|vtt|ass|txt|doc|docx|pdf|rtf|md|csv|xlsx|png|jpg|jpeg|webp|heic)$/i;
const YAO_REC_SKIP_NAME = /^(?:\..*|node_modules|vendor|plugins?|dist|build|coverage|__pycache__|venv|env|target|Library|Applications|codex-local|official-desktop|upstream|tooling|artifact-sessions|runtime-generations)$/i;
const YAO_REC_PRIVATE_NAME = /(?:^|[._-])(?:secrets?|tokens?|passwords?|passwd|credentials?|cookies?|auth|id_rsa|id_ed25519)(?:[._-]|$)/i;
const YAO_REC_ENGINEERING_NAME = /^(?:readme(?:\.[^.]+)?|agents\.md|skill\.md|license(?:\.[^.]+)?)$/i;
const YAO_REC_RELATED_NAME = /视频|剪辑|素材|物料|剧集|剧本|字幕|分镜|台词|人物关系|镜头|剪口|画幅|trailer|storyboard|subtitle|timeline/i;

function YaoRecRoot(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\u0000-\u001f]/.test(value)) return null;
  const parts = value.split('/').filter(Boolean);
  if (/^(?:\/private)?\/tmp(?:\/|$)|^\/var\/tmp(?:\/|$)|^\/private\/var\/folders(?:\/|$)/i.test(value)) return null;
  if (parts.includes('..') || parts.some(part => YAO_REC_SKIP_NAME.test(part))) return null;
  // An unselected home folder is not a project scan target.
  if (!parts.length || (parts[0] === 'Users' && parts.length < 3)) return null;
  return '/' + parts.join('/');
}

function YaoRecReadSession() {
  try {
    const stored = JSON.parse(globalThis.localStorage?.getItem(YAO_REC_STORAGE_KEY) ?? 'null');
    return {
      counter: Number.isSafeInteger(stored?.counter) ? stored.counter : 0,
      previousIds: Array.isArray(stored?.previousIds) ? stored.previousIds.filter(value => typeof value === 'string').slice(0, 6) : [],
    };
  } catch { return {counter: 0, previousIds: []}; }
}

function YaoRecSaveSession(record) {
  try { globalThis.localStorage?.setItem(YAO_REC_STORAGE_KEY, JSON.stringify(record)); } catch {}
}

function YaoRecCycle(key) {
  const session = YaoRecReadSession();
  let entropy;
  try { entropy = Array.from(globalThis.crypto.getRandomValues(new Uint32Array(2))).join('-'); }
  catch { entropy = String(Math.random()); }
  const counter = session.counter + 1;
  YaoRecSaveSession({...session, counter});
  return {counter, previousIds: session.previousIds, seed: `${Date.now()}:${counter}:${entropy}:${key}`};
}

function YaoRecRequest(rpc, method, params, signal, timeoutMs = 1800) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener('abort', onAbort);
      callback(value);
    };
    const onAbort = () => finish(reject, new Error('Recommendation metadata request canceled.'));
    const timeout = setTimeout(() => finish(reject, new Error('Recommendation metadata request timed out.')), timeoutMs);
    signal.addEventListener('abort', onAbort, {once: true});
    if (signal.aborted) { onAbort(); return; }
    Promise.resolve().then(() => {
      if (signal.aborted) throw new Error('Recommendation metadata request canceled.');
      return rpc.sendRequest(method, params, {priority: 'background'});
    })
      .then(value => finish(resolve, value), error => finish(reject, error));
  });
}

function YaoRecThreadRows(response, cwd, now) {
  return (Array.isArray(response?.data) ? response.data : []).filter(thread => {
    if (!thread || thread.ephemeral || thread.parentThreadId || ['ambient_suggestions', 'guardian_review', 'memory_consolidation', 'subagent'].includes(thread.threadSource)) return false;
    if (thread.archived || thread.isArchived || thread.isSubagent || thread.is_subagent) return false;
    if (YaoRecRoot(thread.cwd) !== cwd) return false;
    const timestamp = Number(thread.updatedAt) * 1000;
    return Number.isFinite(timestamp) && timestamp <= now + 300000 && now - timestamp <= 7 * 86400000;
  }).slice(0, 30);
}

async function YaoRecRecentFiles(rpc, cwd, signal) {
  const files = [];
  const root = await YaoRecRequest(rpc, 'fs/getMetadata', {path: cwd}, signal);
  if (!root?.isDirectory || root.isSymlink) return files;
  const directories = [{path: cwd, depth: 0}];
  let inspections = 0;
  let directoryCount = 0;
  // At most sixty metadata inspections across the selected directory and two
  // child levels. Directory names are inspected before any traversal.
  while (directories.length && inspections < 60 && directoryCount < 10 && !signal.aborted) {
    const directory = directories.shift();
    directoryCount++;
    let listing;
    try { listing = await YaoRecRequest(rpc, 'fs/readDirectory', {path: directory.path}, signal); }
    catch { continue; }
    const candidates = (Array.isArray(listing?.entries) ? listing.entries : [])
      .filter(entry => typeof entry?.fileName === 'string' && entry.fileName && !/[\/\\\u0000-\u001f]/.test(entry.fileName)
        && entry.fileName !== '..' && !YAO_REC_SKIP_NAME.test(entry.fileName) && !YAO_REC_PRIVATE_NAME.test(entry.fileName)
        && !YAO_REC_ENGINEERING_NAME.test(entry.fileName)
        && (!/\.md$/i.test(entry.fileName) || YAO_REC_RELATED_NAME.test(entry.fileName))
        && ((entry.isFile && YAO_REC_MEDIA_EXT.test(entry.fileName)) || (entry.isDirectory && directory.depth < 2)))
      .sort((left, right) => Number(right.isFile) - Number(left.isFile) || left.fileName.localeCompare(right.fileName));
    for (let start = 0; start < candidates.length && inspections < 60 && !signal.aborted; start += 4) {
      const batch = candidates.slice(start, Math.min(start + 4, start + 60 - inspections));
      inspections += batch.length;
      const results = await Promise.allSettled(batch.map(async entry => {
        const path = `${directory.path}/${entry.fileName}`;
        const metadata = await YaoRecRequest(rpc, 'fs/getMetadata', {path}, signal);
        return {entry, path, metadata};
      }));
      for (const result of results) {
        if (result.status !== 'fulfilled' || signal.aborted) continue;
        const {entry, path, metadata} = result.value;
        if (!metadata || metadata.isSymlink) continue;
        if (metadata.isDirectory && directory.depth < 2 && directories.length + directoryCount < 10) {
          directories.push({path, depth: directory.depth + 1});
        } else if (metadata.isFile && YAO_REC_MEDIA_EXT.test(entry.fileName)) {
          files.push({name: entry.fileName, path, cwd, modifiedAtMs: metadata.modifiedAtMs,
            isSymlink: false, isDirectory: false, type: 'file'});
        }
      }
    }
  }
  return files.sort((left, right) => (right.modifiedAtMs || 0) - (left.modifiedAtMs || 0)).slice(0, 60);
}

function YaoRecRow({task, controller}) {
  const available = Boolean(controller && typeof controller.setPromptText === 'function' && typeof controller.focus === 'function');
  const genuineSource = task.sourceKind === 'thread' || task.sourceKind === 'file';
  const contextual = task.sourceKind !== 'general';
  const iconPath = task.sourceKind === 'thread' ? 'M4 4.5h12v8H9l-4 3v-3H4zM7 8h6'
    : task.sourceKind === 'file' ? 'M5.5 4.5h9v11h-9zM8 8h4M8 11h4' : 'M7 4.5l8 5.5-8 5.5z';
  const select = () => {
    if (!available) return;
    controller.setPromptText(task.prompt);
    controller.focus();
  };
  return H9.jsxs('button', {
    type: 'button', className: 'yao-recommendation-row', disabled: !available,
    'data-yao-recommendation-id': task.id, 'data-source-kind': task.sourceKind,
    title: [genuineSource ? task.sourceLabel : '', task.title, contextual ? task.description : ''].filter(Boolean).join(' '),
    'aria-label': `${task.title}${genuineSource ? `，${task.sourceLabel}` : ''}${available ? '，填入输入框' : '，输入框尚未就绪'}`,
    onClick: select,
    children: [
      H9.jsx('svg', {className: 'yao-recommendation-icon', viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true,
        children: H9.jsx('path', {d: iconPath, stroke: 'currentColor', strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round'})}),
      H9.jsxs('span', {className: 'yao-recommendation-content', children: [
        genuineSource ? H9.jsx('span', {className: 'yao-recommendation-source', 'data-kind': task.sourceKind, children: task.sourceLabel}) : null,
        H9.jsx('span', {className: 'yao-recommendation-title', children: task.title}),
      ]}),
    ],
  }, task.id);
}

function YaoHomeRecommendations({controller}) {
  const scope = d(hv);
  const scopeRef = L9.useRef(scope);
  scopeRef.current = scope;
  const hostId = Z(Av);
  const workspace = Z(Zle);
  const projects = Z(are);
  const selection = Z(OS);
  const location = ba();
  const project = (Array.isArray(projects) ? projects : []).find(value => value.projectId === selection?.projectId);
  const local = hostId === 'local' && selection?.type !== 'remote' && project?.projectKind !== 'remote';
  const defaultCwd = typeof YAO_RECOMMENDATION_DEFAULT_CWD === 'undefined' ? null : YAO_RECOMMENDATION_DEFAULT_CWD;
  const selectedPath = project?.path ?? project?.rootPaths?.[0] ?? (selection?.projectId ? workspace?.cwd : defaultCwd ?? workspace?.cwd);
  const selectedCwd = local ? YaoRecRoot(selectedPath) : null;
  const routeKey = `${location?.key ?? ''}:${scope.value?.clientThreadId ?? ''}`;
  const contextKey = `${hostId ?? ''}:${selectedCwd ?? ''}:${selection?.projectId ?? ''}:${routeKey}`;
  const fallback = L9.useMemo(() => createRecommendations({catalog: YAO_RECOMMENDATION_CATALOG,
    selectedCwd: selectedCwd ?? '', now: Date.now(), seed: `${contextKey}:${Date.now()}`} ), [contextKey]);
  const [state, setState] = L9.useState({key: '', result: null, loading: true});
  L9.useEffect(() => {
    const abort = new AbortController();
    const cycle = YaoRecCycle(contextKey);
    const now = Date.now();
    const options = {catalog: YAO_RECOMMENDATION_CATALOG, selectedCwd: selectedCwd ?? '', now,
      seed: cycle.seed, previousIds: cycle.previousIds};
    const initial = createRecommendations(options);
    let disposed = false;
    setState({key: contextKey, result: initial, loading: Boolean(local && selectedCwd)});
    const deadline = setTimeout(() => abort.abort(), 6500);
    const load = async () => {
      let result = initial;
      if (local && selectedCwd) {
        try {
          const rpc = qh(scopeRef.current, hostId);
          // Files are always collected independently of conversation history.
          // An individual request failure does not discard the other source.
          const threadWork = YaoRecRequest(rpc, 'thread/list', {archived: false, cursor: null, limit: 30,
            sortKey: 'updated_at', sortDirection: 'desc', cwd: selectedCwd, useStateDbOnly: true}, abort.signal)
            .then(response => YaoRecThreadRows(response, selectedCwd, now), () => []);
          const fileWork = YaoRecRecentFiles(rpc, selectedCwd, abort.signal).catch(() => []);
          const [threads, files] = await Promise.all([threadWork, fileWork]);
          result = createRecommendations({...options, threads, files});
        } catch {}
      }
      if (!disposed) {
        setState({key: contextKey, result, loading: false});
        YaoRecSaveSession({counter: cycle.counter, previousIds: result.previousIds});
      }
      clearTimeout(deadline);
    };
    void load();
    return () => { disposed = true; clearTimeout(deadline); abort.abort(); };
  }, [hostId, selectedCwd, contextKey, local]);
  const current = state.key === contextKey ? state.result : fallback;
  const loading = state.key === contextKey ? state.loading : Boolean(local && selectedCwd);
  return K9.jsx('div', {
    className: 'yao-home-recommendations', 'data-yao-home-recommendations': '',
    'data-context-origin': current.metadata.contextOrigin,
    'data-requires-file-context': current.metadata.requiresFileContext || undefined, 'aria-busy': loading,
    children: [current.context, current.general].map((tasks, index) => K9.jsx('div', {
      className: 'yao-recommendation-group', 'data-recommendation-group': index === 0 ? 'context' : 'general',
      role: 'group', 'aria-label': index === 0 ? '继续当前素材工作' : '视频素材推荐任务',
      children: tasks.map(task => H9.jsx(YaoRecRow, {task, controller}, task.id)),
    }, index)),
  });
}
