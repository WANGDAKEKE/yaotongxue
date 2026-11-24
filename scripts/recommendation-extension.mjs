const target = 'app-primary-9bb8fd8d770a.js';
const composerLeaf = '(0,K9.jsx)(DX,{value:k?M:null,children:ti(void 0,e)})';
export const recommendationSourceFiles = [target];

/** Append the independent recommendation leaf after the official composer. */
export function applyRecommendationExtension(name, source, {runtimeSource, engineSource, catalog, defaultProjectCwd = null}) {
  if (name !== target) return source;
  if (typeof runtimeSource !== 'string' || !runtimeSource.includes('function YaoHomeRecommendations(')) {
    throw new Error('Recommendation runtime is missing.');
  }
  if (typeof engineSource !== 'string' || !engineSource.includes('function createRecommendations(')) {
    throw new Error('Recommendation engine is missing.');
  }
  const tasks = Array.isArray(catalog) ? catalog : catalog?.tasks;
  if (!Array.isArray(tasks) || tasks.length < 9 || new Set(tasks.map(task => task.id)).size !== tasks.length) {
    throw new Error('Recommendation catalog needs at least nine distinct tasks.');
  }
  if (source.split(composerLeaf).length !== 2 || source.includes('// YAO_HOME_RECOMMENDATIONS_EXTENSION')) {
    throw new Error('Recommendation composer checkpoint changed.');
  }
  // The pure module contains named function exports only. No code is evaluated
  // during the build, and imports/default exports are deliberately rejected.
  const engine = engineSource.replace(/^export\s+(?=function\s)/gm, '');
  if (/^\s*(?:import\s|export\s)/m.test(engine)) throw new Error('Unexpected recommendation engine module syntax.');
  const followupLeaf = 'hidden:e!=null,ref:e==null?F?.setFollowUpSuggestionsPortalTarget:void 0';
  if (source.split(followupLeaf).length !== 2) throw new Error('Recommendation follow-up checkpoint changed.');
  const next = source
    .replace(composerLeaf, `${composerLeaf},e==null&&!k?(0,K9.jsx)(YaoHomeRecommendations,{controller:c}):null`)
    .replace(followupLeaf, 'hidden:e!=null,"data-yao-home-followups":"",ref:e==null?F?.setFollowUpSuggestionsPortalTarget:void 0');
  return next + '\n// YAO_HOME_RECOMMENDATIONS_EXTENSION\nvar YAO_RECOMMENDATION_CATALOG=' + JSON.stringify(catalog)
    + ';\nvar YAO_RECOMMENDATION_DEFAULT_CWD=' + JSON.stringify(defaultProjectCwd) + ';\n' + engine + '\n' + runtimeSource + '\n';
}
