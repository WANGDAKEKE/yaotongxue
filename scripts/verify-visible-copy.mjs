import assert from 'node:assert/strict';
import {vendorPath} from './paths.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyVisibleCopy,visibleCopySourceFiles,visibleMessageRanges,adaptVisibleMessage,sceneCopy,messageFormatSignature} from './visible-copy.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const vendor=vendorPath('extracted-app/webview/assets');
const skeleton=(name,source)=>{
 let result=source;
 for(const entry of visibleMessageRanges(name,source).toReversed())result=result.slice(0,entry.start)+'"VISIBLE_MESSAGE"'+result.slice(entry.end);
 return result;
};
const formatTokens=messageFormatSignature;

const synthetic='const id="ChatGPT";const route="codex/foo";const match=/defaultMessage:`ChatGPT`/;const code=`defaultMessage:\\`ChatGPT\\``;let a={id:`composer.test`,defaultMessage:`{tool, select, codex {Codex} other {ChatGPT}} <chatGPTLink>ChatGPT</chatGPTLink> https://chatgpt.com .codex/config.toml CODEX_HOME @codex gpt-5-codex OpenAI API`};let dynamic={defaultMessage:`ChatGPT ${user}`};';
const syntheticName='app-initial-f3e281fb9a71.js';
const transformed=applyVisibleCopy(syntheticName,synthetic);
assert.equal(skeleton(syntheticName,transformed.source),skeleton(syntheticName,synthetic));
assert.ok(transformed.source.includes('codex {姚同学} other {姚同学}'));
for(const expected of ['const id="ChatGPT"','const route="codex/foo"','/defaultMessage:`ChatGPT`/','const code=`defaultMessage:\\`ChatGPT\\``','https://chatgpt.com','.codex/config.toml','CODEX_HOME','@codex','gpt-5-codex','OpenAI API','<chatGPTLink>','defaultMessage:`ChatGPT ${user}`'])assert.ok(transformed.source.includes(expected),expected);
const oldValue=visibleMessageRanges(syntheticName,synthetic)[0].value;
const newValue=visibleMessageRanges(syntheticName,transformed.source)[0].value;
assert.deepEqual(formatTokens(newValue),formatTokens(oldValue));
assert.equal(applyVisibleCopy(syntheticName,transformed.source).source,transformed.source);
const reversed='var item={defaultMessage:`Create a new document`,id:`home.newChatPageSuggestions.createDocument`};';
assert.equal(visibleMessageRanges('home-ambient-suggestions-content-9283c47526f6.js',applyVisibleCopy('home-ambient-suggestions-content-9283c47526f6.js',reversed).source)[0].value,'写一份剪辑简报');
assert.equal(adaptVisibleMessage('ChatGPT Work').value,'视频工作');
assert.equal(adaptVisibleMessage('ChatGPT','sidebarElectron.productMode.chatGpt').value,'视频助手');
assert.equal(adaptVisibleMessage('ChatGPT Work','sidebarElectron.productMode.chatGptWork.unavailable').value,'视频工作');
assert.equal(adaptVisibleMessage('Work','composer.home.modeToggle.work').value,'视频工作');
assert.equal(adaptVisibleMessage('Continue on chatgpt.com','codexMobile.setupDialog.mfaRequired.primary').value,'继续授权');
assert.equal(adaptVisibleMessage('Authorize on chatgpt.com','settings.remoteConnections.authorizationDialog.authorize').value,'打开授权页面');
assert.equal(adaptVisibleMessage('自动 · 中').value,'自动，中');
assert.equal(adaptVisibleMessage('·').value,' ');
assert.equal(adaptVisibleMessage('•••• {last4}').value,'•••• {last4}');
assert.equal(adaptVisibleMessage('https://chatgpt.com/a·b `codex · help`').value,'https://chatgpt.com/a·b `codex · help`');
assert.equal(adaptVisibleMessage('Sol·licita °C·kg/mol 3·4').value,'Sol·licita °C·kg/mol 3·4');
assert.equal(adaptVisibleMessage('• 先看素材\n• 再排节奏').value,' 先看素材\n 再排节奏');
for(const value of Object.values(sceneCopy))assert.ok(!/宣发|[·•]|ChatGPT/i.test(value),'Adapted scene copy must use short material-production wording: '+value);

const files=[];const retained=[];const retainedSeparators=[];let totalMessages=0,changedMessages=0,sceneMessages=0;
const technicalTypes={url:0,plainDomain:0,path:0,routedMention:0,modelId:0,apiSdkCli:0,cliCommand:0,icuMetadata:0,literalCommandOrConfigExample:0};
const seenSceneIds=new Set();
for(const name of visibleCopySourceFiles){
 const source=await fs.readFile(path.join(vendor,name),'utf8');
 const result=applyVisibleCopy(name,source);
 const before=visibleMessageRanges(name,source),after=visibleMessageRanges(name,result.source);
 totalMessages+=before.length;
 assert.equal(skeleton(name,result.source),skeleton(name,source),'Non-message JavaScript changed: '+name);
 assert.equal(after.length,before.length,'Message count changed: '+name);
 for(let index=0;index<before.length;index++){
  const a=before[index],b=after[index];
  assert.equal(a.id,b.id,'Message identifier changed: '+name);
  if(a.value!==b.value){
   assert.deepEqual(formatTokens(b.value),formatTokens(a.value),'Intl arguments or rich tags changed: '+name+' '+a.id);
   changedMessages++;
   if(a.id&&Object.hasOwn(sceneCopy,a.id)){sceneMessages++;seenSceneIds.add(a.id);}
  }
  if(/\b(?:ChatGPT|Codex)\b/i.test(b.value)){
   const subsequent=adaptVisibleMessage(b.value,b.id);
   assert.equal(subsequent.value,b.value,'Unadapted display branding: '+name+' '+a.id);
   retained.push({file:name,id:a.id,sample:b.value.slice(0,120)});
   if(/(?:https?|wss?|file|mailto|codex|chatgpt):/i.test(b.value))technicalTypes.url++;
   if(/\b(?:chatgpt|openai|codex)\.[a-z]{2,}/i.test(b.value))technicalTypes.plainDomain++;
   if(/(?:[./\\~][\w.\/@{}-]*(?:chatgpt|openai|codex)|(?:chatgpt|openai|codex)[\w.-]*[\/\\])/i.test(b.value))technicalTypes.path++;
   if(/@(?:codex|openai|chatgpt)\b/i.test(b.value))technicalTypes.routedMention++;
   if(/\b(?:gpt-[\w.-]+|codex-(?:mini|max)[\w.-]*|chatgpt-[\w.-]+)\b/i.test(b.value))technicalTypes.modelId++;
   if(/\b(?:OpenAI|Codex)\s+(?:API|SDK|CLI)\b/.test(b.value))technicalTypes.apiSdkCli++;
   if(/\bcodex\s+(?:--?[\w-]+|login|logout|app-server|mcp|resume|exec|review|fork|features|apply|completion|cloud|debug|sandbox|help|version|config)\b/.test(b.value))technicalTypes.cliCommand++;
   if(messageFormatSignature(b.value).icu.some(token=>/chatgpt|codex/i.test(token.join(' '))))technicalTypes.icuMetadata++;
   if(/`[^`]*(?:chatgpt|codex)[^`]*`/i.test(b.value))technicalTypes.literalCommandOrConfigExample++;
  }
  if(/[·•]/.test(b.value)){
   assert.equal(adaptVisibleMessage(b.value,b.id).value,b.value,'Unadapted separator: '+name+' '+a.id);
   retainedSeparators.push({file:name,id:a.id,sample:b.value.slice(0,120),kind:/••/.test(b.value)?'maskedNumber':'protectedContentOrTechnicalValue'});
  }
 }
 assert.equal(applyVisibleCopy(name,result.source).source,result.source,'Non-idempotent adaptation: '+name);
 if(result.changes.length)files.push({file:name,...result.changes[0]});
}
for(const id of Object.keys(sceneCopy))assert.ok(seenSceneIds.has(id),'Scene copy not found: '+id);
const report={verifiedAt:new Date().toISOString(),candidateFiles:visibleCopySourceFiles.length,changedFiles:files.length,totalMessages,changedMessages,sceneMessages,sceneCopyIds:[...seenSceneIds],invariants:{onlyLocalizedValuesAndDefaultMessagesChanged:true,allIdentifiersAndCodeOutsideMessageValuesIdentical:true,icuArgumentsAndRichTagsPreserved:true,dynamicTemplatesNotRewritten:true,idempotent:true,onboardingAndHomeHeroAdaptationNotOverridden:true,twoModeLabelsAreVideoWorkAndVideoAssistant:true,sceneCopyUsesMaterialProductionWithoutMiddleDot:true},technicalBrandReferences:{count:retained.length,types:technicalTypes,reason:'URLs, filesystem paths, routed mentions, CLI/API/SDK dependency names, exact model IDs and ICU metadata retain their technical identity; type counts may overlap',examples:retained.slice(0,24)},retainedSeparatorValues:{count:retainedSeparators.length,maskedNumbers:retainedSeparators.filter(v=>v.kind==='maskedNumber').length,protectedContentOrTechnicalValues:retainedSeparators.filter(v=>v.kind==='protectedContentOrTechnicalValue').length,examples:retainedSeparators.slice(0,12)},providerName:'OpenAI remains the actual external API/model/terms provider; it is not relabeled as Tencent',files};
await fs.mkdir(path.join(root,'build'),{recursive:true});
await fs.writeFile(path.join(root,'build/visible-copy-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidateFiles:report.candidateFiles,changedFiles:report.changedFiles,changedMessages,sceneMessages,technicalReferences:retained.length,invariants:'passed'},null,2));
