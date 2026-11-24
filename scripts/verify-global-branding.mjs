// Validate the built overlay, rather than a screenshot or the native app UI.
import fs from 'node:fs/promises';
import {vendorPath} from './paths.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {brandingLeafPlan,brandSourceFiles,assetPlan,brandAssetContent} from './global-branding.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=vendorPath('extracted-app/webview');
const overlay=path.join(root,'build/ui-overlay/webview');
const mark=await fs.readFile(path.join(root,'assets/yingqing-mark.svg'),'utf8');
const expectedPaths=[...mark.matchAll(/<path\b([^>]+)>/g)].map(([,a])=>({d:a.match(/\bd="([^"]+)"/)[1],fill:a.match(/\bfill="([^"]+)"/)[1]}));
assert.equal(expectedPaths.length,4);
const cache=new Map();
const read=async name=>{
 if(!cache.has(name))cache.set(name,await fs.readFile(path.join(overlay,'assets',name),'utf8'));
 return cache.get(name);
};
function expressionEnd(source,start){
 let quote=null,escaped=false;const stack=[];
 for(let i=start;i<source.length;i++){
  const c=source[i];
  if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue;}
  if(c==='`'||c==='"'||c==="'"){quote=c;continue;}
  if('([{'.includes(c))stack.push(c);
  else if(')]}'.includes(c)){if(!stack.length)return i;stack.pop();}
  else if(!stack.length&&(c===','||c===';'))return i;
 }
 throw new Error('Unterminated branding expression');
}
const leafResults=[];
for(const c of brandingLeafPlan){
 const source=await read(c.file);
 const start=source.indexOf(c.symbol+'=e=>');
 assert.ok(start>=0,'Missing built brand leaf '+c.file+' '+c.symbol);
 const bodyStart=start+(c.symbol+'=e=>').length;
 const expression=source.slice(bodyStart,expressionEnd(source,bodyStart));
 const runtime={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
 const render=new Function(c.runtime,`return e=>(${expression});`)(runtime);
 const click=()=>true;
 const supplied={className:'existing-class',id:'brand-verification','aria-label':'保留的可访问名称',onClick:click,style:{opacity:.8},width:123,height:45};
 const element=render(supplied);
 assert.equal(element.type,'svg');
 for(const [key,value] of Object.entries(supplied))assert.equal(element.props[key],value,'Prop changed: '+c.symbol+' '+key);
 assert.equal(element.props.viewBox,c.viewBox);
 assert.equal(element.props['data-yao-brand-mark'],'tencent-video');
 const originalDefaults=render({});
 assert.equal(originalDefaults.props.width,c.width.startsWith('`')?c.width.slice(1,-1):Number(c.width));
 assert.equal(originalDefaults.props.height,c.height.startsWith('`')?c.height.slice(1,-1):Number(c.height));
 const children=c.wordmark?element.props.children:[element.props.children];
 const group=children.find(child=>child.type==='g');
 assert.ok(group);
 assert.deepEqual(group.props.children.map(child=>({d:child.props.d,fill:child.props.fill})),expectedPaths);
 assert.ok(!expression.includes('new URL')&&!expression.includes('`image`'),'Shared logo must use self-contained vectors');
 leafResults.push({file:c.file,symbol:c.symbol,propsAndHandlersPreserved:true,originalDefaultDimensionsPreserved:true,inlineTencentPaths:4});
}

const assetResults=[];
for(const item of assetPlan){
 const source=await read(item.name);
 assert.equal(source,brandAssetContent(item.name,mark),'Static asset branding differs: '+item.name);
 assert.match(source,/width="24" height="24"/);
 assetResults.push(item.name);
}
const rasterNames=[
 'codex-app-ga-logo-3e5209898ca3.png',
 'chatgpt-4815d619c174.png',
 'chatgpt-iris-vibrant-dark-f96cf0d3bd49.png',
 'chatgpt-iris-vibrant-light-9f5a2e48c3cb.png',
];
// Build signatures from the actual original SVGs, plus distinct size variants.
const signatures=new Set(['M13.8076 13.1477','M11.6475 18.3409','M6.13673 5.84428','M30.8694 50.7428']);
for(const item of assetPlan){
 const original=await fs.readFile(path.join(vendor,'assets',item.name),'utf8');
 for(const [,d] of original.matchAll(/\bd="([^"]+)"/g))if(d.length>500)signatures.add(d.slice(0,40));
}
const originalOccurrences=[];
const remaining=[];
const rasterRefs=[];
let scanned=0;
for(const dir of ['','assets']){
 const entries=await fs.readdir(path.join(vendor,dir),{withFileTypes:true});
 for(const entry of entries){
  if(!entry.isFile()||!['.js','.css','.svg','.html'].includes(path.extname(entry.name)))continue;
  const relative=path.join(dir,entry.name);
  const original=await fs.readFile(path.join(vendor,relative),'utf8');
  let actual;
  try{actual=await fs.readFile(path.join(overlay,relative),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;actual=original;}
  scanned++;
  for(const signature of signatures){
   const matches=original.split(signature).length-1;
   if(matches)originalOccurrences.push({file:relative,signature,count:matches});
   if(actual.includes(signature))remaining.push({file:relative,signature});
   const encoded=encodeURIComponent(signature);
   if(encoded!==signature&&actual.includes(encoded))remaining.push({file:relative,signature,encoding:'percent'});
  }
  if(actual.includes('nm:`Blossom centerline`'))remaining.push({file:relative,signature:'Lottie Blossom centerline'});
  for(const from of rasterNames)if(actual.includes(from))rasterRefs.push({file:relative,from});
 }
}
assert.deepEqual(remaining,[],'Original app-owned logo geometry remains: '+JSON.stringify(remaining));
assert.deepEqual(rasterRefs,[],'Original brand raster still referenced: '+JSON.stringify(rasterRefs));
const registry=await read('app-shared-60f4bb85435f.js');
const regStart=registry.indexOf('name:`openai-logo-regular-lg-light-16`');
assert.ok(registry.slice(regStart,regStart+1300).includes('paint:{kind:`multicolor`}'));
assert.ok(registry.slice(regStart).includes('<g transform="scale(.5)">'));
const initial=await read('app-initial-f3e281fb9a71.js');
assert.ok(initial.includes('sxi=`'+mark.replace(/\s+/g,' ').trim()+'`'));
for(const name of ['hello-32885a5730fb.js','loader-b7cf9a60c18f.js']){
 const original=await fs.readFile(path.join(vendor,'assets',name),'utf8');
 const actual=await read(name);
 // Four new filled paths, while the surrounding layer animation stays intact.
 assert.equal((actual.match(/"nm":"Tencent Video path"/g)||[]).length,4);
 assert.ok(!actual.includes('Blossom centerline'));
 // The SVG renderer searches groups in reverse and appends them in that order.
 const shapesStart=actual.indexOf('shapes:[{"ty":"gr","nm":"Tencent Video ');
 assert.ok(shapesStart>=0);
 const firstFill=actual.slice(shapesStart).match(/"ty":"fl","nm":"Tencent Video fill","c":\{"a":0,"k":\[([^\]]+)\]/)?.[1];
 assert.equal(firstFill,'1,1,1','Lottie white core must be painted last');
 const outsideShapes=s=>{
  const marker=s.includes('nm:`Blossom outline`')?'nm:`Blossom outline`':'"nm":"Tencent Video path"';
  const mid=s.indexOf(marker),start=s.lastIndexOf('shapes:[',mid)+'shapes:'.length;
  let depth=0,end=-1;
  // Shape arrays use no brackets in quoted values.
  for(let i=start;i<s.length;i++){if(s[i]==='[')depth++;if(s[i]===']'&&--depth===0){end=i+1;break;}}
  return s.slice(0,start)+'[LOGO_VECTOR]'+s.slice(end);
 };
 assert.equal(outsideShapes(actual),outsideShapes(original),'Animation tracks changed: '+name);
}
const report={
 status:'passed',scannedFiles:scanned,
 sharedSvgLeaves:leafResults,staticSvgAssets:assetResults,
 brandingChunks:brandSourceFiles,
 originalGeometryOccurrences:originalOccurrences,
 remainingKnownAppOwnedLogoGeometry:remaining,
 remainingOldBrandRasterReferences:rasterRefs,
 exclusions:[
  {kind:'user-avatar-shapes',files:['profile-dff36ef77cc6.js','src-dc5e79e00707.js'],reason:'Blossom photo masks and profile customization belong to user content.'},
  {kind:'pet-art-and-theme-options',files:['app-initial-f3e281fb9a71.js','coral-pop-knot-dark-6b0e6c5a65a2.svg','coral-pop-knot-light-b7e0daf447c1.svg'],reason:'User pet artwork and accent-theme option icons are not application brand marks.'},
  {kind:'third-party-favicons',reason:'Browsing results and source/application icons retain their identity.'},
  {kind:'semantic-icon-names',reason:'Internal registry keys and historical asset filenames are retained for compatibility; their app-owned visual output is replaced.'},
 ],
 nativeUiControlled:false,
 lottiePaintOrderEvidence:{file:'lottie_light-6d958e55eef3.js',method:'Z.prototype.searchShapes',traversal:'e.length-1 → 0; appendChild(group)',shapeOrder:'white, green, orange, blue; rendered blue, orange, green, white'},
};
await fs.writeFile(path.join(root,'build/global-branding-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,scannedFiles:scanned,sharedSvgLeaves:leafResults.length,staticSvgAssets:assetResults.length,remainingOriginalGeometry:remaining.length,remainingOldRasterReferences:rasterRefs.length}));
