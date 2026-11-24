import fs from 'node:fs/promises';

const runtimeSource = await fs.readFile(new URL('../src/home-tips.js', import.meta.url), 'utf8');
export const homeSourceFiles = ['app-primary-9bb8fd8d770a.js', 'zh-CN-8bcb976a6283.js'];
export const homeContextCopy = {
  'home.hero.noProjectWhatShouldWeBuild': '腾讯视频的素材工作台',
  'home.hero.whatShouldWeBuildInSelectedProject': '腾讯视频素材项目：<projectSelect>{projectName}</projectSelect>',
  'home.hero.whatShouldWeWorkOnInProject': '腾讯视频素材项目：<projectSelect>{projectName}</projectSelect>',
  'home.hero.workModeWhatShouldWeWorkOn': '腾讯视频的素材工作台',
};

const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const template = value => value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

export function applyHomeExtension(name, source, {tips, posters, sources = []}) {
  if (!homeSourceFiles.includes(name)) return source;
  let result = source;
  const once = (from, to) => {
    if (result.split(from).length !== 2) throw new Error('Home extension checkpoint changed: ' + from.slice(0, 120));
    result = result.replace(from, to);
  };
  for (const [id, value] of Object.entries(homeContextCopy)) {
    const pattern = name.startsWith('zh-CN-')
      ? new RegExp('("' + escapeRE(id) + '":)`(?:\\\\.|[^`])*`', 'g')
      : new RegExp('(id:`' + escapeRE(id) + '`,defaultMessage:)`(?:\\\\.|[^`])*`', 'g');
    let count = 0;
    result = result.replace(pattern, (_, prefix) => { count++; return prefix + '`' + template(value) + '`'; });
    if (count !== 1) throw new Error('Home message checkpoint changed: ' + id + ' (' + count + ')');
  }
  if (name === 'app-primary-9bb8fd8d770a.js') {
    if (!Array.isArray(tips) || tips.length < 2 || tips.some(tip => typeof tip !== 'string' || !tip.trim())) {
      throw new Error('Home tips must contain at least two readable messages.');
    }
    if (!Array.isArray(posters) || posters.some(poster => !poster.title || !/^\.\/yao-posters\/[\w.-]+$/.test(poster.src))) {
      throw new Error('Home posters must reference local decorative image assets.');
    }
    // Change only the ordinary home's host element. Its original props, refs,
    // class names, controller, editor child and project callbacks pass through.
    once('children:e=>(0,K9.jsx)(`div`,{"data-lighthouse-navigation":',
         'children:e=>(0,K9.jsx)(YaoHomeSurface,{"data-lighthouse-navigation":');
    once('className:`group/title inline-block max-w-full`,children:m',
         'className:`group/title inline-block max-w-full`,children:(0,H9.jsx)(YaoHomeTips,{context:m})');
    once('"data-home-ambient-suggestions":!0,layout:',
         '"data-home-ambient-suggestions":!0,"data-yao-home-suggestions":"",layout:');
    once('composer:_n?(0,K9.jsxs)(`div`,{className:',
         'composer:_n?(0,K9.jsxs)(`div`,{"data-yao-home-composer":"",className:');
    const citations = Object.fromEntries(sources.map(entry => [entry.display, '摘自 ' + entry.source + '，' + entry.topic + '\n' + entry.url + '\n' + entry.conversion]));
    result += '\n// YAO_HOME_EXTENSION\nvar YAO_HOME_TIPS=' + JSON.stringify(tips) + ';\nvar YAO_HOME_TIP_SOURCES=' + JSON.stringify(citations) + ';\nvar YAO_HOME_POSTERS=' + JSON.stringify(posters) + ';\n' + runtimeSource + '\n';
  }
  return result;
}
