export function extendOnboarding(name, source, {navigation, roleDemo, catalog}) {
  let result = source;
  function once(from, to) {
    if (result.split(from).length !== 2) throw new Error('Onboarding extension checkpoint changed: ' + from.slice(0, 100));
    result = result.replace(from, to);
  }
  if (name === 'onboarding-page-15d0879c5b68.js') {
    // Keep the original screen and controllers. Add a scoped navigation wrapper.
    once('function Pf(e){let t=(0,Lf.c)(88)', 'function Pf(e){let t=(0,Lf.c)(89)');
    once('(0,Rf.useEffect)(ie,U);let ae;', '(0,Rf.useEffect)(ie,U);e.yaoAbortRef&&(e.yaoAbortRef.current=()=>{te.current?.abort(),te.current=null,ne(!1)});let ae;');
    once('t[81]!==c||t[82]!==re?(ye=', 't[81]!==c||t[82]!==re||t[88]!==e.yaoProgress?(ye=');
    once('(0,zf.jsx)(Qs,{onSkipConfirmationBypassed:b', '(0,zf.jsx)(Qs,{progress:e.yaoProgress,yaoPersonalizedSuggestionsEnabled:e.yaoPersonalizedSuggestionsEnabled,onSkipConfirmationBypassed:b');
    once('t[81]=c,t[82]=re,t[83]=ye)', 't[81]=c,t[82]=re,t[88]=e.yaoProgress,t[83]=ye)');
    // Reuse the official attempt cancellation, generation reset and task reset.
    // Keep selected role, custom role input and personalized preference intact.
    once('r?.resetConversationalOutcome(),Mt(Y),io(u),ms(u),u.set(hs,null),ce(null),rt(``),u.set(un,{roles:[],personalizedSuggestionsEnabled:!0,workMode:null})',
         'r?.resetConversationalOutcome(),Mt(Y),ms(u),u.set(hs,null)');
    once('t[215]!==void 0', 't[215]!==fn');
    once('t[215]=void 0', 't[215]=fn');
    once('(wn=(0,sp.jsx)(Pf,{existingRole:', '(wn=(0,sp.jsx)(YaoNavigableOnboarding,{onYaoCancelTask:fn,existingRole:');
    result += '\n// YAO_ONBOARDING_EXTENSION\n' + navigation + '\n';
  }
  if (name === 'use-conversational-onboarding-local-plugins-e68fed1b57c7.js') {
    once('[C,w]=(0,Kt.useState)(!0)', '[C,w]=(0,Kt.useState)(e.yaoPersonalizedSuggestionsEnabled??!0)');
  }
  if (name === 'tasks-4aa0b66fb4ee.js') {
    // Offer the same two executable, bundled examples to every role. Keep the
    // official native dispatch, permissions, cancellation, preview and file APIs.
    // Pin the catalog entry point too, so backend assignments or experiments
    // cannot turn the demonstration back into role-dependent plugin tasks.
    once('function fu(e){return{role:e,task_ids:[...oi],task_definitions:Fi.tasks}}',
         'function fu(e){return{role:e,task_ids:[`desktop_note`,`csv_chart`],task_definitions:Fi.tasks}}');
    once('};f(r);let p=c.size>0;return p||f(oi),{catalog:',
         '};f([`desktop_note`,`csv_chart`]);let p=c.size>0;return p||f([`desktop_note`,`csv_chart`]),{catalog:');
    once('visibleTaskIds:s?(0,wu.default)(Array.from(c.keys())):Array.from(c.keys())',
         'visibleTaskIds:Array.from(c.keys())');
  }
  return result;
}
