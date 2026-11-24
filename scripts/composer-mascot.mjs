// Add one display-only sibling to the shared composer surface. Its anchor scope
// has no layout box, so the original surface, scrolling and handlers stay intact.
export const composerMascotSourceFiles = ['app-initial-f3e281fb9a71.js'];
export const composerMascotDesign = {
  asset: 'qq-composer-hug.png',
  static: true,
  canvasWidth: 112,
  imageEdgeRatio: 945 / 1254,
  maximumVisibleOverlap: (1027 - 945) / 1254 * 112,
  minimumVisibleLeftInset: 175 / 1254 * 112,
  placement: 'upper left of the actual composer border',
  inputAndPointerEventsRetained: true,
};
export const composerMascotOriginalLeaf = '(0,kk.jsx)(Ak,{value:ee,children:de})';
export const composerMascotDecoratedLeaf = '(0,kk.jsx)(Ak,{value:ee,children:(0,kk.jsxs)(`div`,{"data-yao-composer-mascot-scope":``,children:[de,O===`default`&&k===`default`&&!o?(0,kk.jsx)(`img`,{"data-yao-composer-mascot":``,src:new URL(`./qq-composer-hug.png`,import.meta.url).href,alt:``,"aria-hidden":!0,draggable:!1,decoding:`async`}):null]})})';

export function applyComposerMascot(name, source) {
  if (!composerMascotSourceFiles.includes(name)) return source;
  const begin = source.indexOf('function ofr(e)');
  const end = source.indexOf('function sfr(e)', begin);
  if (begin < 0 || end < 0) throw new Error('Shared composer boundary changed.');
  const component = source.slice(begin, end);
  if (component.split(composerMascotOriginalLeaf).length !== 2) throw new Error('Shared composer provider checkpoint changed.');
  const next = component.replace(composerMascotOriginalLeaf, composerMascotDecoratedLeaf);
  if (next.replace(composerMascotDecoratedLeaf, composerMascotOriginalLeaf) !== component) throw new Error('Composer surface changed outside decorative leaf.');
  return source.slice(0, begin) + next + source.slice(end);
}
