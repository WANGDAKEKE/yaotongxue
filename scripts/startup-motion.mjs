// Scope brand animation to the existing startup logo. No timers, navigation,
// async work, new callbacks or new React memo slots are introduced.
const welcome = 'onboarding-page-15d0879c5b68.js';
const hook = 'transition:w,onAnimationComplete:T,children:E';
const adaptedHook = 'transition:w,onAnimationComplete:T,"data-yao-startup":r&&f&&!d?"intro":void 0,children:E';

export const startupMotionDesign = Object.freeze({
  durationMs: 820,
  rotationDegrees: [-16, 1.4, 0],
  scale: [0.76, 1.045, 1],
  blurPixels: [9, 0.4, 0],
  repeat: 0,
  originalLayoutAndAnimationCompletionCallbackRetained: true,
  activation: 'showInitialLogoSplash && originalWindowFocusGateReady && !originalReducedMotion',
  reducedMotion: 'static logo; no reveal or glint',
});

export function applyStartupMotion(name, source) {
  if (name !== welcome) return source;
  if (source.includes(adaptedHook)) throw new Error('Startup motion already applied.');
  const begin = source.indexOf('function mp(');
  const end = source.indexOf('var hp,gp,_p,vp,yp,bp,xp;', begin);
  if (begin < 0 || end < 0) throw new Error('Official startup logo wrapper changed.');
  const wrapper = source.slice(begin, end);
  if (wrapper.split(hook).length !== 2) throw new Error('Official startup callback checkpoint changed.');
  // D already depends on b (r), x (f) and w (d). Their original memo dependencies
  // invalidate D whenever this derived activation condition can change, so no
  // extra cache slots or event listeners are needed.
  const next = wrapper.replace(hook, adaptedHook);
  if (next.replace(adaptedHook, hook) !== wrapper) throw new Error('Unexpected startup wrapper modification.');
  return source.slice(0, begin) + next + source.slice(end);
}

export function applyStartupHtmlMotion(html) {
  const link = '<link rel="stylesheet" href="./assets/yao-brand-motion.css">';
  if (html.includes(link)) throw new Error('Startup motion stylesheet already linked.');
  if (!html.includes('</head>')) throw new Error('Startup document head missing.');
  return html.replace('</head>', link + '</head>');
}
