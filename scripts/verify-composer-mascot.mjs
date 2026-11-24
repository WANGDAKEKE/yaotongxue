import fs from 'node:fs/promises';
import {vendorPath} from './paths.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {applyComposerMascot,composerMascotSourceFiles,composerMascotOriginalLeaf,composerMascotDecoratedLeaf,composerMascotDesign} from './composer-mascot.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=vendorPath('extracted-app/webview/assets');
const overlay=path.join(root,'build/ui-overlay/webview/assets');
const checks=[];
function check(name,condition){if(!condition)throw new Error(name);checks.push(name);}
function component(source){const begin=source.indexOf('function ofr(e)'),end=source.indexOf('function sfr(e)',begin);if(begin<0||end<0)throw new Error('Shared composer component missing');return source.slice(begin,end);}
const name=composerMascotSourceFiles[0];
const original=await fs.readFile(path.join(vendor,name),'utf8');
const adapted=applyComposerMascot(name,original);
check('original surface and every interaction/scroll handler preserved byte-for-byte',component(adapted).replace(composerMascotDecoratedLeaf,composerMascotOriginalLeaf)===component(original));
check('only one decorative image leaf and no event handlers',component(adapted).split('"data-yao-composer-mascot":').length===2&&!/\bon(?:Click|Mouse|Pointer|Load|Error):/.test(composerMascotDecoratedLeaf));
check('hidden from accessibility, dragging and pointer interaction',composerMascotDecoratedLeaf.includes('"aria-hidden":!0,draggable:!1')&&composerMascotDecoratedLeaf.includes('alt:``'));
check('document, inline, compact and inert composer variants excluded',composerMascotDecoratedLeaf.includes('O===`default`&&k===`default`&&!o?'));
const css=await fs.readFile(path.join(root,'src/composer-mascot.css'),'utf8');
check('no animations, timers or overflow changes added',!/(?:animation|transition|overflow)[\w-]*\s*:|@keyframes|set(?:Timeout|Interval)/.test(css));
check('layout-free scope and border anchors for home and conversation',css.includes('display: contents;')&&css.includes('anchor-scope: --yao-composer-edge;')&&css.includes('[data-composer-utility-bar-variant="home"] [data-composer-body]')&&css.includes('position-anchor: --yao-composer-edge;'));
check('static image cannot intercept mouse input',css.includes('pointer-events: none;')&&css.includes('user-select: none;'));
check('visible flippers overlap by less than 8px and body starts at least 15px from left border',composerMascotDesign.maximumVisibleOverlap<8&&composerMascotDesign.minimumVisibleLeftInset>=15);
const image=await fs.readFile(path.join(root,'assets/qq-composer-hug.png'));
check('1254px transparent PNG asset',image.subarray(1,4).toString()==='PNG'&&image.readUInt32BE(16)===1254&&image.readUInt32BE(20)===1254&&image[25]===6);
if(process.argv.includes('--overlay')){
 const built=await fs.readFile(path.join(overlay,name),'utf8');
 check('built shared composer matches audited decorative leaf exactly',component(built)===component(adapted));
 check('packed asset matches generated image',image.equals(await fs.readFile(path.join(overlay,'qq-composer-hug.png'))));
 const html=await fs.readFile(path.join(root,'build/ui-overlay/webview/index.html'),'utf8');
 check('mascot stylesheet is loaded by application',html.includes('./assets/yao-composer-mascot.css'));
}
const report={verifiedAt:new Date().toISOString(),checks,static:true,source:name,assetSha256:crypto.createHash('sha256').update(image).digest('hex'),nativeUIAutomationUsed:false};
await fs.mkdir(path.join(root,'verification'),{recursive:true});
await fs.writeFile(path.join(root,'verification/composer-mascot-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Composer mascot: ${checks.length} checks passed. Original composer surface and handlers preserved.`);
