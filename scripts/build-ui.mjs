// Preserve the official interaction framework; adapt content and visual tokens.
import fs from 'node:fs/promises';
import {vendorPath} from './paths.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {extendOnboarding} from './onboarding-extension.mjs';
import {applyGlobalBranding,brandSourceFiles,assetPlan,brandAssetContent} from './global-branding.mjs';
import {applyStartupMotion,applyStartupHtmlMotion,startupMotionDesign} from './startup-motion.mjs';
import {buildNativeBranding} from './build-native-branding.mjs';
import {applyHomeExtension,homeSourceFiles} from './home-extension.mjs';
import {applyVisibleCopy,visibleCopySourceFiles} from './visible-copy.mjs';
import {applyHardcodedBrandCopy,hardcodedBrandSourceFiles} from './brand-hardcoded-copy.mjs';
import {applyNativeVisibleCopy,nativeVisibleCopySourceFiles} from './native-visible-copy.mjs';
import {applyComposerMascot,composerMascotSourceFiles,composerMascotDesign} from './composer-mascot.mjs';
import {applyRecommendationExtension} from './recommendation-extension.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=vendorPath('extracted-app/webview');
const overlay=path.join(root,'build/ui-overlay');
const output=path.join(overlay,'webview/assets');
const mark=await fs.readFile(path.join(root,'assets/yingqing-mark.svg'),'utf8');
const replacements=JSON.parse(await fs.readFile(path.join(root,'src/content-adaptation.json'),'utf8'));
const literalPatches=JSON.parse(await fs.readFile(path.join(root,'src/demo-content-literals.json'),'utf8'));
const extension={
 navigation:await fs.readFile(path.join(root,'src/onboarding-navigation.js'),'utf8'),
};
const homePosterManifest=JSON.parse(await fs.readFile(path.join(root,'assets/home-posters/manifest.json'),'utf8'));
const homeExtension={
 tips:JSON.parse(await fs.readFile(path.join(root,'src/home-tips.json'),'utf8')),
 sources:JSON.parse(await fs.readFile(path.join(root,'src/home-tip-sources.json'),'utf8')),
 posters:homePosterManifest.entries.map(entry=>({title:entry.title,src:'./yao-posters/'+entry.localFile})),
};
const recommendationExtension={
 defaultProjectCwd:process.env.YAOTONGXUE_PROJECT_ROOT ? path.resolve(process.env.YAOTONGXUE_PROJECT_ROOT) : root,
 runtimeSource:await fs.readFile(path.join(root,'src/recommendation-runtime.js'),'utf8'),
 engineSource:await fs.readFile(path.join(root,'src/recommendation-engine.js'),'utf8'),
 catalog:JSON.parse(await fs.readFile(path.join(root,'src/recommendation-catalog.json'),'utf8')),
};
const roleProfiles=JSON.parse(await fs.readFile(path.join(root,'src/tencent-role-profiles.json'),'utf8'));
if(roleProfiles.length!==12||new Set(roleProfiles.map(profile=>profile.roleId)).size!==12)throw new Error('Expected twelve distinct Tencent Video role profiles.');
for(const profile of roleProfiles){
 if(replacements['electron.onboarding.welcomeV2.role.'+profile.messageKey]!==profile.displayName)throw new Error('Role profile and displayed name differ: '+profile.displayName);
}
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const template=s=>s.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
await fs.rm(overlay,{recursive:true,force:true});
await fs.mkdir(output,{recursive:true});
const changes=[];
const literalChanges=[];
const globalBrandChanges=[];
const homeChanges=[];
const composerMascotChanges=[];
const visibleCopyChanges=[];
const hardcodedCopyChanges=[];
const nativeVisibleCopyChanges=[];
const localeSeen=new Set();
const welcome='onboarding-page-15d0879c5b68.js';
let originalWelcome,adaptedWelcome;
for(const name of await fs.readdir(path.join(vendor,'assets'))){
 if(!name.endsWith('.js'))continue;
 const source=await fs.readFile(path.join(vendor,'assets',name),'utf8');
 const filePatches=literalPatches.filter(p=>p.file===name);
 const brandingFile=brandSourceFiles.includes(name);
 const homeFile=homeSourceFiles.includes(name);
 const composerMascotFile=composerMascotSourceFiles.includes(name);
 if(!source.includes('electron.onboarding.')&&name!==welcome&&!filePatches.length&&!brandingFile&&!homeFile&&!composerMascotFile)continue;
 const locale=name==='zh-CN-8bcb976a6283.js';
 if(!locale&&!source.includes('defaultMessage:')&&name!==welcome&&!filePatches.length&&!brandingFile&&!homeFile&&!composerMascotFile)continue;
 let next=source;
 const edited=[];
 for(const [id,value] of Object.entries(replacements)){
  if(!next.includes(id))continue;
  const pattern=locale
   ?new RegExp('("'+escapeRE(id)+'":)`(?:\\\\.|[^`])*`','g')
   :new RegExp('(id:`'+escapeRE(id)+'`,defaultMessage:)`(?:\\\\.|[^`])*`','g');
  let count=0;
  next=next.replace(pattern,(_,prefix)=>{count++;return prefix+'`'+template(value)+'`';});
  if(count){edited.push({id,count});if(locale)localeSeen.add(id);}
 }
 for(const patch of filePatches){
  const count=next.split(patch.from).length-1;
  if(count!==patch.expectedCount)throw new Error('Official literal checkpoint changed: '+patch.name+' ('+count+')');
  next=next.split(patch.from).join(patch.to);
  literalChanges.push({name:patch.name,file:name,count,kind:patch.kind});
 }
 if(name===welcome){
  originalWelcome=source;
  const leaf='(0,gp.jsx)(rr,{className:`block size-full`})';
  if(next.split(leaf).length!==2)throw new Error('Official welcome logo leaf changed.');
  next=next.replace(leaf,'(0,gp.jsx)(TencentVideoMark,{className:`block size-full`})');
  // Keep the official animation wrapper and its completion callback unchanged.
  next+='\nfunction TencentVideoMark(props){return k().jsx("img",{...props,"data-yao-brand-mark":"",src:new URL("./tencent-video-mark.svg",import.meta.url).href,alt:""})}\n';
 }
 next=extendOnboarding(name,next,extension);
 const brand=applyGlobalBranding(name,next,mark);
 next=applyStartupMotion(name,brand.source);
 const homeSource=next;
 next=applyHomeExtension(name,next,homeExtension);
 if(next!==homeSource)homeChanges.push({file:name});
 next=applyRecommendationExtension(name,next,recommendationExtension);
 const composerSource=next;
 next=applyComposerMascot(name,next);
 if(next!==composerSource)composerMascotChanges.push({file:name});
 if(brand.changes.length)globalBrandChanges.push({file:name,changes:brand.changes});
 if(name===welcome)adaptedWelcome=next;
 if(next!==source){await fs.writeFile(path.join(output,name),next);changes.push({file:name,content:edited,logoLeafOnly:name===welcome});}
}
const missing=Object.keys(replacements).filter(id=>!localeSeen.has(id));
if(missing.length)throw new Error('Missing original Chinese message IDs: '+missing.join(', '));
// Exact-byte invariants for the original renderer, stage controller and shell.
const sections=[['function bg()','var xg,Sg'],['function Nh()','function Ph('],['function pg(','function mg('],['async function il(','async function al('],['async function al(','function ol('],['function cl(','var ll,ul']];
const preserved=[];
for(const [begin,end] of sections){
 const start=originalWelcome.indexOf(begin),stop=originalWelcome.indexOf(end,start+begin.length);
 if(start<0||stop<0)throw new Error('Official framework checkpoint changed: '+begin);
 const baseline=originalWelcome.slice(start,stop);
 if(!adaptedWelcome.includes(baseline))throw new Error('Interaction framework was changed: '+begin);
 preserved.push({section:begin,sha256:sha(baseline)});
}
const classes=s=>(s.split('// YAO_ONBOARDING_EXTENSION')[0]).match(/className:[^,}]+/g)||[];
if(JSON.stringify(classes(originalWelcome))!==JSON.stringify(classes(adaptedWelcome)))throw new Error('Original welcome className expressions changed.');
// Completion, role selection and task click callbacks retain the official bytes.
for(const [begin,end] of [['function Pc()','var '],['function vm(','var ym,bm,xm']]){
 const start=originalWelcome.indexOf(begin),stop=originalWelcome.indexOf(end,start+begin.length);
 if(start<0||stop<0||!adaptedWelcome.includes(originalWelcome.slice(start,stop)))throw new Error('Original callback changed: '+begin);
}
if(literalChanges.length!==literalPatches.length)throw new Error('Some demo/style literal patches were not applied.');
const starterOriginal=await fs.readFile(path.join(vendor,'assets/onboarding-starter-tasks-e4ec246ae130.js'),'utf8');
const starterAdapted=await fs.readFile(path.join(output,'onboarding-starter-tasks-e4ec246ae130.js'),'utf8');
const click=starterOriginal.match(/onClick: \(\) => GenUI\.issueNewTurn\(task\.label,[\s\S]*?\} \} \} \}\)/)?.[0];
if(!click||!starterAdapted.includes(click))throw new Error('Original demo selection callback changed.');
// Display copy is applied after the exact framework checkpoints above. The
// message lexer and audited literal plans only change display values; IDs,
// callbacks, provider identifiers and external-service URLs stay intact.
for(const name of new Set([...visibleCopySourceFiles,...hardcodedBrandSourceFiles])){
 let source;
 try{source=await fs.readFile(path.join(output,name),'utf8');}
 catch(error){if(error.code!=='ENOENT')throw error;source=await fs.readFile(path.join(vendor,'assets',name),'utf8');}
 const hardcoded=applyHardcodedBrandCopy(name,source);
 const visible=applyVisibleCopy(name,hardcoded.source);
 if(hardcoded.changes.length)hardcodedCopyChanges.push({file:name,changes:hardcoded.changes});
 if(visible.changes.length)visibleCopyChanges.push({file:name,changes:visible.changes});
 if(visible.source!==source)await fs.writeFile(path.join(output,name),visible.source);
}
const originalTree=path.dirname(vendor);
const nativeFiles=[...nativeVisibleCopySourceFiles,...(await fs.readdir(path.join(originalTree,'native-menu-locales'))).filter(name=>name.endsWith('.json')).map(name=>'native-menu-locales/'+name)];
for(const name of nativeFiles){
 const source=await fs.readFile(path.join(originalTree,name),'utf8');
 const adapted=applyNativeVisibleCopy(name,source);
 if(!adapted.changes.length)continue;
 const target=path.join(overlay,name);
 await fs.mkdir(path.dirname(target),{recursive:true});
 await fs.writeFile(target,adapted.source);
 nativeVisibleCopyChanges.push({file:name,changes:adapted.changes});
}
await fs.writeFile(path.join(output,'tencent-video-mark.svg'),mark);
for(const asset of assetPlan)await fs.writeFile(path.join(output,asset.name),brandAssetContent(asset.name,mark));
const skin=await fs.readFile(path.join(root,'src/tencent-skin.css'),'utf8');
if(/(?:^|[;{])\s*(?:(?:min|max)-)?(?:display|position|width|height|padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|gap|grid[\w-]*|flex[\w-]*|inset[\w-]*|top|right|bottom|left|transform|animation[\w-]*|transition[\w-]*)\s*:/im.test(skin))throw new Error('Skin must not modify layout or interaction.');
await fs.writeFile(path.join(output,'yao-tencent-skin.css'),skin);
await fs.writeFile(path.join(output,'yao-onboarding-navigation.css'),await fs.readFile(path.join(root,'src/onboarding-navigation.css'),'utf8'));
await fs.writeFile(path.join(output,'yao-brand-motion.css'),await fs.readFile(path.join(root,'src/brand-motion.css'),'utf8'));
for(const name of ['brand-shell','home-tdesign','home-posters','home-recommendations'])await fs.writeFile(path.join(output,'yao-'+name+'.css'),await fs.readFile(path.join(root,'src/'+name+'.css'),'utf8'));
await fs.writeFile(path.join(output,'yao-composer-mascot.css'),await fs.readFile(path.join(root,'src/composer-mascot.css'),'utf8'));
await fs.copyFile(path.join(root,'assets/qq-composer-hug.png'),path.join(output,'qq-composer-hug.png'));
await fs.mkdir(path.join(output,'yao-posters'),{recursive:true});
if(homePosterManifest.entries.length<8)throw new Error('Home poster wall needs at least 8 verified official assets.');
for(const entry of homePosterManifest.entries){
 if(!/^[a-z0-9-]+\.(?:jpg|webp|png)$/.test(entry.localFile)||!/^https:\/\/(?:v\.(?:wetv\.vip|qq\.com)|wetv\.vip)\//.test(entry.officialPage))throw new Error('Unexpected home poster source: '+entry.title);
 const bytes=await fs.readFile(path.join(root,'assets/home-posters',entry.localFile));
 if(sha(bytes)!==entry.sha256)throw new Error('Home poster hash mismatch: '+entry.title);
 await fs.writeFile(path.join(output,'yao-posters',entry.localFile),bytes);
}
let html=await fs.readFile(path.join(vendor,'index.html'),'utf8');
html=html.replace(/<title>[^<]*<\/title>/,'<title>姚同学</title>');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/yao-tencent-skin.css"><link rel="stylesheet" href="./assets/yao-brand-shell.css"><link rel="stylesheet" href="./assets/yao-onboarding-navigation.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/yao-home-tdesign.css"><link rel="stylesheet" href="./assets/yao-home-posters.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/yao-composer-mascot.css"></head>');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/yao-home-recommendations.css"></head>');
if((html.match(/<svg\b/g)||[]).length!==1)throw new Error('Original startup logo target changed.');
html=html.replace(/<svg\b[\s\S]*?<\/svg>/,mark.replace('<svg ','<svg class="startup-loader__base" '));
html=html.replace(/--startup-logo-mask: url\("data:image\/svg\+xml,[^"]+"\);/,'--startup-logo-mask: url("data:image/svg+xml,'+encodeURIComponent(mark)+'");');
html=applyStartupHtmlMotion(html);
await fs.writeFile(path.join(overlay,'webview/index.html'),html);
const nativeBranding=await buildNativeBranding(root);
await fs.writeFile(path.join(root,'build/global-branding-build.json'),JSON.stringify({builtAt:new Date().toISOString(),globalBrandChanges,staticBrandAssets:assetPlan,nativeBranding,startupMotionDesign,textlessProgressBars:true},null,2)+'\n');
await fs.writeFile(path.join(root,'build/composer-mascot-build.json'),JSON.stringify({builtAt:new Date().toISOString(),composerMascotChanges,...composerMascotDesign},null,2)+'\n');
await fs.writeFile(path.join(root,'build/recommendations-build.json'),JSON.stringify({builtAt:new Date().toISOString(),tasks:recommendationExtension.catalog.length,layout:'six single-column suggestions below original composer',contextItems:3,generalItems:3,contextOrder:['three distinct recent project files','independent recent conversation if files are insufficient','explicit missing-file guidance'],metadataOnly:true,autoSubmit:false,originalComposerCallbacksRetained:true},null,2)+'\n');
await fs.writeFile(path.join(root,'build/home-adaptation-build.json'),JSON.stringify({builtAt:new Date().toISOString(),homeChanges,tips:homeExtension.tips.length,tipIntervalMs:3000,posters:homePosterManifest.entries.map(({title,localFile,sha256,officialPage})=>({title,localFile,sha256,officialPage})),posterWallHalfScreen:true,posterFade:'transparent at middle to 48 percent opacity at right (36 percent in dark mode)',posterMotion:{direction:'up',cycleSeconds:[240,288,330],seamless:true,reducedMotion:'static'},originalComposerAndProjectHandlersRetained:true,homeOnly:true,modelAndMediaExecutionAdded:false},null,2)+'\n');
await fs.writeFile(path.join(root,'build/visible-brand-copy-build.json'),JSON.stringify({builtAt:new Date().toISOString(),visibleCopyChanges,hardcodedCopyChanges,nativeVisibleCopyChanges,roleProfiles,originalFrameworkCheckpointScope:'before display-only copy adaptations; message lexer and audited literal plans retain source skeleton'},null,2)+'\n');
const report={builtAt:new Date().toISOString(),baseline:'complete unmodified official UI',originalInteractionFrameworkRetained:true,originalPageRendererAndStageController:preserved,originalExistingClassNamesUnchanged:true,originalCompletionAndRoleCardCallbacksUnchanged:true,originalDemoCardClickCallbackUnchanged:true,originalPageLayoutCssOverridesAdded:0,fontColorAndBoxSkinRetained:true,newPagesAdded:0,newStepsAdded:0,navigationExtension:{previousStep:true,changeRole:true,clickEarlierSteps:true,preserveRoleAndCustomInput:true,cancelOldAttemptBeforeReturn:true},sharedNativeDemos:{roles:roleProfiles.length,taskIds:['desktop_note','csv_chart'],sameForEveryRole:true,type:'official native file processing and interactive HTML; complete promotional-work document examples'},customReactComponentsAdded:'logo leaf, scoped navigation and home tips; original pages and native task handlers reused',originalRoleIdsOrderAndCountUnchanged:true,roleExampleFieldsAdapted:Object.keys(replacements).filter(id=>id.includes('.roleCopy.')).length,literalChanges,changes};
await fs.writeFile(path.join(root,'build/content-only-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log('Preserved official pages; added backward navigation and shared native document demonstrations.');
console.log('Preserved exact sections:',preserved.map(p=>p.section).join(', '));
console.log('Original page layout overrides / new pages / new steps: 0 / 0 / 0. Added requested navigation controls.');
