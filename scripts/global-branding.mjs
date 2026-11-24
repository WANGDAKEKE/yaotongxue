// Branding leaves only. This module never edits the official application tree.
// Keep all calling components, props, dimensions, event handlers and navigation.
import crypto from 'node:crypto';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const icon24 = {width:'`1em`',height:'`1em`',viewBox:'0 0 24 24',size:24,fill:'currentColor'};
const components = {
  'app-shared-60f4bb85435f.js': [
    {symbol:'z2',runtime:'u8t',width:'21',height:'21',viewBox:'0 0 21 21',size:21,fill:'none',signature:'M11.6475 18.3409'},
  ],
  'app-initial-f3e281fb9a71.js': [
    {symbol:'Ins',runtime:'Fns',width:'36',height:'36',viewBox:'0 0 36 36',size:36,fill:'none',signature:'M13.8076 13.1477'},
  ],
  'SegmentedControl-3d4b7f64fbe5.js': [
    {symbol:'WR',runtime:'UR',...icon24,signature:'M9.20509 8.76514'},
    {symbol:'IR',runtime:'FR',...icon24,signature:'M13.7958 23.893'},
    {symbol:'JR',runtime:'qR',...icon24,signature:'M9.81648 9.47276'},
    {symbol:'BR',runtime:'zR',...icon24,signature:'M13.4302 21.5'},
    {symbol:'QR',runtime:'ZR',...icon24,signature:'M13.4977 21.9'},
    {symbol:'bN',runtime:'yN',...icon24,signature:'M22.418 9.822'},
  ],
  'register-DNfAakVi-4dadb8ead107.js': [
    {symbol:'tK',runtime:'X',...icon24,signature:'M9.20509 8.76514'},
    {symbol:'$G',runtime:'X',...icon24,signature:'M13.7958 23.893'},
    {symbol:'nK',runtime:'X',...icon24,signature:'M9.81648 9.47276'},
    {symbol:'eK',runtime:'X',...icon24,signature:'M13.4302 21.5'},
    {symbol:'rK',runtime:'X',...icon24,signature:'M13.4977 21.9'},
    {symbol:'IW',runtime:'X',...icon24,signature:'M22.418 9.822'},
    {symbol:'bI',runtime:'X',...icon24,signature:'M23 7.85169C23 7.59052'},
  ],
  'AppChatgpt-cf0a4ab61713.js': [
    {symbol:'a',runtime:'i',...icon24,signature:'M23 7.85169C23 7.59052'},
  ],
  'shell-4ae481dfe0e6.js': [
    {symbol:'Li',runtime:'Ii',...icon24,signature:'M13.7958 23.893'},
  ],
  'chatgpt-wordmark-174304c6b71e.js': [
    {symbol:'i',runtime:'r',width:'357',height:'62',viewBox:'0 0 357 62',size:null,fill:'none',signature:'M30.8694 50.7428',wordmark:true},
  ],
};

const rasterReferences = {
  'app-initial-f3e281fb9a71.js': ['codex-app-ga-logo-3e5209898ca3.png'],
  'page-fcb7d0bcae35.js': ['chatgpt-4815d619c174.png'],
  'blossom-fidget-29d839596ebf.js': [
    'chatgpt-iris-vibrant-dark-f96cf0d3bd49.png',
    'chatgpt-iris-vibrant-light-9f5a2e48c3cb.png',
  ],
};

// Original URL names are retained so registry imports and CSS masks keep working.
// Consumers should write the provided Tencent SVG text at these overlay paths.
export const assetPlan = [
  'openai_logo_regular-ceb75a1754fa.svg',
  'openai_logo_bold-b397e5645582.svg',
  'openai_logo_regular_bounding_box-7d7de901cdaa.svg',
  'openai_logo_bold_bounding_box-b5f4839d5bdf.svg',
  'openai_logo_webapp_variable_480-3615778388ce.svg',
  'app_chatgpt-c704ec60a561.svg',
  'app_chatgpt_cursor-92975a0e58cf.svg',
  'logo-18892d25d393.svg',
].map(name => ({name,kind:'svg',source:'tencent-video-mark.svg'}));

export const brandingLeafPlan=Object.entries(components).flatMap(([file,leaves])=>leaves.map(leaf=>({file,...leaf})));

export function brandAssetContent(name,mark) {
  if(!assetPlan.some(item=>item.name===name))throw new Error('Unknown branded asset: '+name);
  // The legacy registry SVGs all have 24 px intrinsic boxes.
  return mark.replace(/\bwidth="32"/,'width="24"').replace(/\bheight="32"/,'height="24"');
}

export const brandSourceFiles = [...new Set([
  ...Object.keys(components),
  ...Object.keys(rasterReferences),
  'visualization-standalone-document-8272cff670ff.js',
  'app-shared-60f4bb85435f.js',
  'hello-32885a5730fb.js',
  'loader-b7cf9a60c18f.js',
])];

// Find an audited pure icon arrow body. Quoted SVG data may contain punctuation.
function arrowEnd(source,start) {
  let quote=null,escaped=false;
  const stack=[];
  const block=source[start]==='{';
  for(let i=start;i<source.length;i++) {
    const c=source[i];
    if(quote) {
      if(escaped)escaped=false;
      else if(c==='\\')escaped=true;
      else if(c===quote)quote=null;
      continue;
    }
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if('([{'.includes(c)){stack.push(c);continue;}
    if(')]}'.includes(c)) {
      if(!stack.length)return i;
      const open=stack.pop();
      if('([{'.indexOf(open)!==')]}'.indexOf(c))throw new Error('Unbalanced brand component');
      if(block&&!stack.length)return i+1;
      continue;
    }
    if(!stack.length&&(c===','||c===';'))return i;
  }
  throw new Error('Could not find branding leaf boundary');
}

function markPaths(mark) {
  const paths=[...mark.matchAll(/<path\b([^>]+)\/?\s*>/g)].map(([,attrs])=>({
    d:attrs.match(/\bd="([^"]+)"/)?.[1],
    fill:attrs.match(/\bfill="([^"]+)"/)?.[1],
  }));
  if(paths.length!==4||paths.some(p=>!p.d||!p.fill))throw new Error('Tencent 4 path vector changed');
  return paths;
}

// Preserve the original Lottie layer transforms and time tracks, replacing only
// the closed logo vector. The official layer uses coordinates centered on zero.
function lottieShapes(mark) {
  const transform={ty:'tr',o:{a:0,k:100},r:{a:0,k:0},p:{a:0,k:[0,0]},a:{a:0,k:[0,0]},s:{a:0,k:[100,100]},sa:{a:0,k:0}};
  return markPaths(mark).map((path,index)=>{
    const tokens=path.d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g);
    const vertices=[],ins=[],outs=[];
    let i=0,cmd;
    const point=()=>[(Number(tokens[i++])-16)*2.5,(Number(tokens[i++])-16)*2.5];
    const push=p=>{vertices.push(p);ins.push([0,0]);outs.push([0,0]);};
    while(i<tokens.length){
      if(/^[A-Za-z]$/.test(tokens[i]))cmd=tokens[i++];
      if(cmd==='M'){push(point());cmd='L';}
      else if(cmd==='L')push(point());
      else if(cmd==='C'){
        const c1=point(),c2=point(),p=point(),last=vertices.length-1;
        if(last<0)throw new Error('Cubic vector missing starting vertex');
        outs[last]=[c1[0]-vertices[last][0],c1[1]-vertices[last][1]];
        push(p);ins[vertices.length-1]=[c2[0]-p[0],c2[1]-p[1]];
      }else if(cmd==='Z'||cmd==='z'){
        if(i!==tokens.length)throw new Error('Unexpected multi-subpath Tencent vector');
        break;
      }else throw new Error('Unsupported Tencent SVG path command: '+cmd);
    }
    const last=vertices.length-1;
    if(last>0&&Math.abs(vertices[last][0]-vertices[0][0])<1e-8&&Math.abs(vertices[last][1]-vertices[0][1])<1e-8){
      ins[0]=ins.pop();vertices.pop();outs.pop();
    }
    const color=path.fill==='white'?[1,1,1]:path.fill.match(/^#([a-f\d]{6})$/i)?.[1]?.match(/../g).map(v=>parseInt(v,16)/255);
    if(!color)throw new Error('Unsupported Tencent vector fill');
    return {ty:'gr',nm:'Tencent Video '+(index+1),it:[
      {ty:'sh',nm:'Tencent Video path',d:1,ks:{k:{i:ins,o:outs,v:vertices,c:true},a:0}},
      {ty:'fl',nm:'Tencent Video fill',c:{a:0,k:color},o:{a:0,k:100},r:1},
      transform,
    ]};
  // Lottie's SVG renderer walks shape groups from the end, then appends them.
  // Reverse SVG paint order so its final white play core stays on top.
  }).reverse();
}

function replacementFor(c,mark) {
  const attrs=`width:${c.width},height:${c.height},viewBox:\`${c.viewBox}\`,fill:\`${c.fill}\`,xmlns:\`http://www.w3.org/2000/svg\``;
  const access=c.wordmark?',role:`img`,focusable:`false`':'';
  const transform=c.wordmark?'translate(147.5 0) scale(1.9375)':`scale(${c.size/32})`;
  const paths=markPaths(mark).map((p,i)=>`(0,${c.runtime}.jsx)(\`path\`,${JSON.stringify(p)},${i})`).join(',');
  const child=`(0,${c.runtime}.jsxs)(\`g\`,{transform:${JSON.stringify(transform)},children:[${paths}]})`;
  return `(0,${c.runtime}.${c.wordmark?'jsxs':'jsx'})(\`svg\`,{${attrs}${access},...e,"data-yao-brand-mark":"tencent-video",children:${c.wordmark?'[(0,'+c.runtime+'.jsx)(`title`,{children:`腾讯视频`}),'+child+']':child}})`;
}

/** Return {source,changes}; all mutations are explicit pure branding leaves. */
export function applyGlobalBranding(name, source, mark) {
  let next=source;
  const changes=[];
  for(const c of components[name]??[]) {
    const target=c.symbol+'=e=>';
    const begin=next.indexOf(target);
    if(begin<0||next.indexOf(target,begin+target.length)>=0)throw new Error('Brand leaf changed: '+name+' '+c.symbol);
    const bodyStart=begin+target.length;
    const end=arrowEnd(next,bodyStart);
    const original=next.slice(bodyStart,end);
    if(!original.includes(c.signature)||!original.includes('...e'))throw new Error('Brand geometry/props checkpoint changed: '+name+' '+c.symbol);
    if(original.includes('onClick:')||original.includes('onChange:')||original.includes('useState'))throw new Error('Brand leaf unexpectedly contains behavior: '+c.symbol);
    next=next.slice(0,bodyStart)+replacementFor(c,mark)+next.slice(end);
    changes.push({kind:'shared-svg-leaf',symbol:c.symbol,originalSha256:sha(original),propsForwarded:true,defaultDimensionsPreserved:true});
  }
  for(const from of rasterReferences[name]??[]) {
    const count=next.split(from).length-1;
    if(count!==1)throw new Error('Brand raster reference changed: '+name+' '+from+' ('+count+')');
    next=next.replace(from,'tencent-video-mark.svg');
    changes.push({kind:'brand-image-reference',from,to:'tencent-video-mark.svg'});
  }
  if(name==='app-initial-f3e281fb9a71.js') {
    const start=next.indexOf('sxi=`<svg');
    const end=next.indexOf('`})',start);
    if(start<0||end<0)throw new Error('Startup shimmer mask boundary changed');
    const original=next.slice(start+'sxi=`'.length,end);
    if(!original.includes('M11.6475 18.3409'))throw new Error('Startup shimmer mask geometry changed');
    next=next.slice(0,start+'sxi=`'.length)+mark.replace(/\s+/g,' ').trim()+next.slice(end);
    changes.push({kind:'startup-shimmer-mask',originalSha256:sha(original),networkIndependent:true});
  }
  if(name==='app-shared-60f4bb85435f.js') {
    // The newer 16 px icon registry uses a vector definition, rather than React.
    const start=next.indexOf('name:`openai-logo-regular-lg-light-16`');
    const bodyStart=next.indexOf('body:`',start)+'body:`'.length;
    const bodyEnd=next.indexOf('`})',bodyStart);
    if(start<0||bodyStart<0||bodyEnd<0)throw new Error('16 px brand vector definition changed');
    const original=next.slice(bodyStart,bodyEnd);
    if(!original.includes('M6.13673 5.84428'))throw new Error('16 px brand geometry changed');
    const inner=mark.replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/\s+/g,' ').trim();
    const section=next.slice(start,bodyStart);
    if(!section.includes('paint:{kind:`monochrome`}'))throw new Error('16 px brand paint definition changed');
    next=next.slice(0,start)+section.replace('paint:{kind:`monochrome`}','paint:{kind:`multicolor`}')+`<g transform="scale(.5)">${inner}</g>`+next.slice(bodyEnd);
    changes.push({kind:'vector-registry-leaf',name:'openai-logo-regular-lg-light-16',originalSha256:sha(original),defaultDimensionsPreserved:true});
  }
  if(name==='hello-32885a5730fb.js'||name==='loader-b7cf9a60c18f.js') {
    const signature='nm:`Blossom outline`';
    const sig=next.indexOf(signature);
    const shapesStart=next.lastIndexOf('shapes:[',sig)+'shapes:'.length;
    if(sig<0||shapesStart<0||next.indexOf(signature,sig+signature.length)>=0)throw new Error('Animated brand shape boundary changed: '+name);
    let depth=0,shapesEnd=-1,quote=null,escaped=false;
    for(let i=shapesStart;i<next.length;i++){
      const c=next[i];
      if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue;}
      if(c==='`'||c==='"'||c==="'"){quote=c;continue;}
      if(c==='[')depth++;
      if(c===']'&&--depth===0){shapesEnd=i+1;break;}
    }
    if(shapesEnd<0)throw new Error('Animated brand shape end changed: '+name);
    const original=next.slice(shapesStart,shapesEnd);
    if(!original.includes('nm:`Blossom centerline`'))throw new Error('Animated brand geometry changed: '+name);
    next=next.slice(0,shapesStart)+JSON.stringify(lottieShapes(mark))+next.slice(shapesEnd);
    changes.push({kind:'lottie-vector-shapes',originalSha256:sha(original),layerTransformsAndTimeTracksPreserved:true});
  }
  if(name==='visualization-standalone-document-8272cff670ff.js') {
    const start=next.indexOf("wordmark:\n      '");
    const end=next.indexOf("',\n    visualize:",start);
    if(start<0||end<0)throw new Error('Portable visualization wordmark boundary changed');
    const valueStart=start+"wordmark:\n      '".length;
    const original=next.slice(valueStart,end);
    if(!original.includes('M30.8694 50.7428'))throw new Error('Portable visualization wordmark geometry changed');
    const inner=mark.replace(/^[\s\S]*?<svg\b[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/\s+/g,' ').trim();
    const svg=`<svg width="357" height="62" viewBox="0 0 357 62" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg"><title>腾讯视频</title><g transform="translate(147.5 0) scale(1.9375)">${inner}</g></svg>`;
    if(/[\\'`]/.test(svg))throw new Error('Unsafe portable branding string');
    next=next.slice(0,valueStart)+svg+next.slice(end);
    changes.push({kind:'portable-svg-wordmark',originalSha256:sha(original),networkIndependent:true,defaultDimensionsPreserved:true});
  }
  return {source:next,changes};
}
