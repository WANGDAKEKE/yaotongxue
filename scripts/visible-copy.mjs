// Change user-visible message values only. Never rewrite JavaScript identifiers,
// routes, message IDs, model IDs, account state, provider configuration or URLs.
// The pinned Node runtime already ships Acorn; use its lexer without executing
// the vendor source and without introducing another runtime dependency.
import vm from 'node:vm';
import sourceFiles from '../src/visible-copy-files.json' with {type:'json'};

const bundledAcorn=process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'];
if(!bundledAcorn)throw new Error('The pinned Node runtime must provide the Acorn lexer.');
const acorn={};
vm.runInNewContext(bundledAcorn,{exports:acorn,module:{exports:acorn}},{timeout:1000,filename:'node-bundled-acorn.js'});
export const visibleCopySourceFiles=Object.freeze(sourceFiles);
const locale='zh-CN-8bcb976a6283.js';

// These are short labels and guidance in existing controls, not new features.
// The home hero's four adapted IDs and all onboarding IDs belong to their own
// modules and are deliberately absent here so their scene-specific copy wins.
export const sceneCopy=Object.freeze({
 'composer.placeholder.newTask.cloud':'这次想做什么素材？',
 'composer.placeholder.newTask.doAnything':'把素材交给姚同学，说说你想怎么剪',
 'composer.placeholder.newTask.locally.chatgptDesktop':'说说素材需求，输入 @ 添加文件或工具',
 'composer.placeholder.newTask.locally.v2':'说说素材需求，输入 @ 添加文件或工具',
 'composer.placeholder.workWithChatGPT':'聊聊这次怎么剪',
 'composer.placeholder.workWithCodex':'开始处理素材',
 'composer.home.workModeAccessSplash.description':'姚同学帮腾讯视频团队整理素材、处理文件、准备剪辑。',
 'composer.codexAccessSplash.description':'从看懂内容到整理片单，和姚同学一起做好每份素材。',
 'chatgptConversations.composer.placeholder':'想从哪段素材开始？',
 'chatgptConversations.writingBlock.generate.placeholder':'说说这段视频要表达什么',
 'chatgptConversations.sidebar.projectSettings.addFiles':'添加视频、剧本和参考文件',
 'chatgptProjectHome.sources.emptyDescription':'添加视频、剧本或人物资料，方便后续查找和剪辑。',
 'chatgptProjectHome.sources.emptyHeading':'先把素材放进来',
 'settings.personalization.aboutYou.morePlaceholder':'你的岗位、常用格式和剪辑习惯',
 'settings.chatGpt.personalization.moreAboutYou.placeholder':'你的岗位、常用格式和剪辑习惯',
 'settings.personalization.aboutYou.nicknamePlaceholder':'希望姚同学怎么称呼你？',
 'settings.chatGpt.personalization.nickname.placeholder':'希望姚同学怎么称呼你？',
 'settings.automations.promptPlaceholderChatGPT':'有哪些素材工作需要定期处理？',
 'sidebar.codexDiscovery':'视频剪辑 Agent',
 'sidebar.explore.codex':'姚同学',
 'sidebar.explore.setupCodex':'设置姚同学',
 'codex.composer.browserDisclaimer':'姚同学是视频剪辑 Agent。交付前记得检查画面、字幕和声音。',
 'codex.composer.browserDisclaimer.aiService':'姚同学是视频剪辑 Agent。交付前记得检查画面、字幕和声音。',
 'codex.composer.browserDisclaimer.workspace':'姚同学是视频剪辑 Agent。交付前记得检查画面、字幕和声音。',
 'restricted.aeonMessaging.roomUi.chatgptDisclaimer':'姚同学陪你把素材做好。',
 'composer.codexAccessSplash.title':'好素材，从这里开剪',
 'composer.home.modeToggle.chat':'视频助手',
 'composer.home.modeToggle.chat.tooltip':'聊素材，说剪法',
 'composer.home.modeToggle.work':'视频工作',
 'codexMobile.setupDialog.mfaRequired.primary':'继续授权',
 'settings.remoteConnections.authorizationDialog.authorize':'打开授权页面',
 'composer.home.modeToggle.work.tooltip':'整理素材，处理文件，推进剪辑',
 'composer.home.workModeAccessSplash.title':'把素材做成作品',
 'composer.newSlashCommand.title':'新建剪辑任务',
 'composer.newSlashCommand.description':'在当前创作空间开启新的剪辑对话',
 'composer.localCwdDropdown.newChat':'新建剪辑任务',
 'composer.localCwdDropdown.newProject':'新建素材项目',
 'composer.localCwdDropdown.chooseProject':'选择素材项目',
 'composer.localCwdDropdown.noActiveRoot':'选择素材项目',
 'composer.localCwdDropdown.noProject':'选择素材项目',
 'composer.localCwdDropdown.searchPlaceholder':'搜索素材项目',
 'composer.localCwdDropdown.changeProjectTooltip':'更换这次剪辑所属的素材项目',
 'composer.localCwdDropdown.addLocalWorkspaceRoot':'添加本地素材项目',
 'composer.localCwdDropdown.addWorkspaceRoot':'添加素材项目',
 'home.hero.letsBuild':'开始创作',
 'home.starterPrompts.empty':'先说说你要做的素材',
 'home.starterPrompts.loading':'正在整理剪辑建议…',
 'home.taskSuggestions.openChat':'打开剪辑对话',
 'home.newChatPageSuggestions.create':'准备素材生产清单',
 'home.newChatPageSuggestions.create.prompt':'按现有资料列一份素材生产清单，写清片型、时长、画幅、文件格式和交付时间。',
 'home.newChatPageSuggestions.createDocument':'写一份剪辑简报',
 'home.newChatPageSuggestions.createDocument.prompt.v5':'使用 {artifact} 写一份剪辑简报。按已提供的资料整理片型、时长、画幅、开场、节奏和交付要求，做成团队可以直接使用的文档。',
 'home.newChatPageSuggestions.createDocumentTemplate':'用模板写剪辑简报',
 'home.newChatPageSuggestions.createPresentation':'整理剪辑方案',
 'home.newChatPageSuggestions.createPresentation.prompt.v5':'使用 {artifact} 整理剪辑方案。按现有资料说明素材范围、表达重点、开场设计、节奏参考和版本安排。',
 'home.newChatPageSuggestions.createPresentationTemplate':'用模板整理剪辑方案',
 'home.newChatPageSuggestions.createSpreadsheet':'建立素材交付表',
 'home.newChatPageSuggestions.createSpreadsheet.prompt.v5':'使用 {artifact} 建立素材交付表。按现有文件填写片名、版本、时长、画幅、格式、负责人和交付时间，支持筛选和导出。',
 'home.newChatPageSuggestions.createSpreadsheetTemplate':'从模板建立素材清单',
 'home.newChatPageSuggestions.createSite':'制作素材预览页',
 'home.newChatPageSuggestions.createSite.prompt.v5':'使用 {artifact} 制作素材预览页。按现有文件展示片名、版本、时长和画幅，方便团队查看和反馈。',
 'home.newChatPageSuggestions.createSiteDrillIn.prompt':'制作素材预览页',
 'home.newChatPageSuggestions.createSitePortfolio':'整理成片展示页',
 'home.newChatPageSuggestions.createSitePortfolio.prompt':'使用 {artifact} 整理成片展示页。按已提供的作品分组展示版本、制作说明和视频预览。',
 'home.newChatPageSuggestions.figureOutNextSteps':'排好素材制作顺序',
 'home.newChatPageSuggestions.figureOutNextSteps.prompt':'根据现有素材和交付要求，列出先做什么、后做什么，写清每一步的输入和产物。',
 'home.newChatPageSuggestions.figureOutNextStepsAfterComparingOptions':'比较不同的剪辑方向',
 'home.newChatPageSuggestions.figureOutNextStepsAfterComparingOptions.prompt':'按已提供的素材，比较人物、冲突和情绪三种剪法，说明各自的开场、节奏和适合的片长。',
 'home.newChatPageSuggestions.figureOutNextStepsForStrategyOrProject':'规划素材生产',
 'home.newChatPageSuggestions.figureOutNextStepsForStrategyOrProject.prompt':'根据素材和交付要求，整理片型、规格、版本和制作顺序，做成团队能执行的生产计划。',
 'home.newChatPageSuggestions.figureOutNextStepsForTopic':'研究一个精彩看点',
 'home.newChatPageSuggestions.figureOutNextStepsForTopic.prompt':'根据我提供的片段，整理人物关系、事件前后和情绪变化，找出可以剪在一起的内容。',
 'home.newChatPageSuggestions.figureOutNextStepsForUpcomingMeeting':'准备剪辑评审',
 'home.newChatPageSuggestions.figureOutNextStepsForUpcomingMeeting.prompt':'按现有方案准备剪辑评审，整理版本差异、开场、节奏、字幕、声音和交付规格。',
 'sidebarElectron.newThread':'新建剪辑任务',
 'sidebarElectron.workNewChatNavLink':'新建剪辑任务',
 'sidebarElectron.recentChats':'剪辑对话',
 'sidebarElectron.chatHistoryNavigation':'剪辑对话记录',
 'sidebarElectron.noTasks':'开始你的第一项素材任务',
 'sidebarElectron.tasksSection.emptyState':'还没有剪辑对话',
 'sidebarElectron.tasksSection.label':'剪辑对话',
 'sidebarElectron.projectsNavLink':'素材项目',
 'sidebarElectron.addGenericWorkspaceRoot':'添加素材项目',
 'sidebarElectron.productMode.chatGpt':'视频助手',
 'sidebarElectron.productMode.chatGptWork.unavailable':'视频工作',
 'sidebarElectron.productMode.codex':'视频工作',
 'sidebarElectron.productMode.codex.description.developer':'整理素材，批量处理文件',
 'sidebarElectron.productMode.work.description.recommended':'处理文件，做好素材',
 'sidebarElectron.flatProjectSidebar.noProjects':'还没有素材项目',
 'projectsIndex.title':'素材项目',
 'projectsIndex.empty':'还没有素材项目',
 'projectsIndex.empty.newProject':'新建素材项目',
 'projectsIndex.empty.subtitle':'把对话和素材放在一个项目里，接着上次的进度做。',
 'projectsIndex.chatGpt.empty.subtitle':'集中管理素材文件、剪辑对话和制作说明。',
 'projectsIndex.chatGpt.chats.empty':'开始这部作品的第一段剪辑对话',
 'projectsIndex.recentChats.empty':'还没有剪辑对话',
 'projectsIndex.startProjectChat':'开始这个项目的剪辑对话',
 'projectsIndex.chatGpt.startProjectChat':'开始这个项目的剪辑对话',
 'threadPage.newThread':'新建剪辑任务',
});

const label=t=>t?.type?.label;
const property=(t,name)=>(label(t)==='name'||label(t)==='string')&&t.value===name;
function staticAt(tokens,index){
 const t=tokens[index];
 if(label(t)==='string')return {value:t.value,start:t.start,end:t.end,quote:'"',length:1};
 if(label(t)==='`'&&label(tokens[index+1])==='template'&&label(tokens[index+2])==='`')return {value:tokens[index+1].value,start:t.start,end:tokens[index+2].end,quote:'`',length:3};
 return null;
}
function descriptorId(history){
 // Intl descriptors put id immediately before defaultMessage in this bundle.
 for(let i=history.length-3;i>=0;i--){
  if(!property(history[i],'id')||label(history[i+1])!==':')continue;
  const value=staticAt(history,i+2);
  if(value&&history[i+2+value.length]&&label(history[i+2+value.length])===',')return value.value;
 }
 return null;
}
function followingDescriptorId(source,end){
 // The search index compiles the same Intl descriptors in reverse property
 // order: {defaultMessage:`...`,id:`...`}. Only inspect the adjacent id value.
 const match=/^\s*,\s*id\s*:\s*(`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/.exec(source.slice(end,end+512));
 if(!match)return null;
 const tokenizer=acorn.tokenizer(match[1],{ecmaVersion:'latest'});
 const first=tokenizer.getToken();
 return label(first)==='string'?first.value:tokenizer.getToken().value;
}

export function visibleMessageRanges(name,source){
 const tokenizer=acorn.tokenizer(source,{ecmaVersion:'latest',sourceType:'module',allowHashBang:true});
 const history=[];const ranges=[];
 for(;;){
  const token=tokenizer.getToken();
  if(label(token)==='eof')break;
  history.push(token);
  if(history.length>40)history.shift();
  // A completed static template or a quoted string value.
  let begin=history.length-1;
  if(label(token)==='`'&&label(history[begin-1])==='template'&&label(history[begin-2])==='`')begin-=2;
  else if(label(token)!=='string')continue;
  const literal=staticAt(history,begin);
  if(!literal)continue;
  const before=history[begin-1],key=history[begin-2];
  let kind=null,id=null;
  if(label(before)===':'&&property(key,'defaultMessage')){
   kind='defaultMessage';id=followingDescriptorId(source,literal.end)||descriptorId(history.slice(0,begin-2));
  }else if(name===locale&&label(before)===':'&&label(key)==='string'){
   kind='localeMessage';id=key.value;
  }else if(name===locale&&label(before)==='='){
   // Chinese catalog aliases are compiled into var a=`message` then reused by
   // dictionary keys. They are display values too, and are never message IDs.
   kind='localeAlias';
  }
  if(kind)ranges.push({...literal,kind,id});
 }
 return ranges;
}

function icuMetadata(value){
 const spans=[],tokens=[];
 const whitespace=position=>{while(/\s/.test(value[position]||'')&&position<value.length)position++;return position;};
 const message=(position,closing=false)=>{
  while(position<value.length){
   if(closing&&value[position]==='}')return position+1;
   if(value[position]==='{'){const next=argument(position);position=next>position?next:position+1;}
   else position++;
  }
  return position;
 };
 const argument=open=>{
  const match=/^([A-Za-z_][\w.-]*)(\s*,\s*(plural|select|selectordinal|number|date|time|duration))?/.exec(value.slice(open+1));
  if(!match)return open+1;
  let position=whitespace(open+1+match[0].length);
  if(!match[3]){
   if(value[position]!=='}')return open+1;
   spans.push([open,position+1]);tokens.push(['argument',match[1],null]);return position+1;
  }
  const type=match[3];tokens.push(['argument',match[1],type]);
  if(!['plural','select','selectordinal'].includes(type)){
   const end=value.indexOf('}',position);
   if(end<0)return open+1;
   spans.push([open,end+1]);return end+1;
  }
  if(value[position]!==',')return open+1;
  spans.push([open,position+1]);position++;
  while(position<value.length){
   position=whitespace(position);
   if(value[position]==='}')return position+1;
   const offset=/^offset\s*:\s*\d+/.exec(value.slice(position));
   if(offset){spans.push([position,position+offset[0].length]);tokens.push(['offset',offset[0]]);position+=offset[0].length;continue;}
   const selector=/^(?:=?[\w.-]+)/.exec(value.slice(position));
   if(!selector)return open+1;
   const end=position+selector[0].length;
   const brace=whitespace(end);
   if(value[brace]!=='{')return open+1;
   spans.push([position,end]);tokens.push(['selector',selector[0]]);
   position=message(brace+1,true);
  }
  return position;
 };
 message(0);
 return {spans,tokens};
}
export function messageFormatSignature(value){return {icu:icuMetadata(value).tokens,richTags:[...value.matchAll(/<\/?([A-Za-z][\w]*)>/g)].map(m=>m[0])};}

function protectedRanges(value){
 const spans=[];
 const add=re=>{for(const m of value.matchAll(re))spans.push([m.index,m.index+m[0].length]);};
 add(/(?:https?|wss?|file|mailto|codex|chatgpt):[^\s<>`]+/gi);
 add(/<\/?[A-Za-z][^>]*>/g); // React Intl rich-text element names
 add(/`[^`]*`/g); // literal command/config examples within the message
 add(/\b(?:OPENAI|CODEX|CHATGPT)_[A-Z0-9_]+\b/g);
 for(const match of value.matchAll(/[~./\\\w:@{}-]+/g)){
  const token=match[0];
  if(/chatgpt|openai|codex/i.test(token)&&(/[\/\\]/.test(token)||/\b(?:chatgpt|openai|codex)\.[a-z]{2,}/i.test(token)))spans.push([match.index,match.index+token.length]);
 }
 add(/@(?:codex|openai|chatgpt)\b/gi); // mentions must keep their routed target
 add(/\b(?:gpt-[\w.-]+|codex-(?:mini|max)[\w.-]*|chatgpt-[\w.-]+)\b/gi);
 add(/\b(?:OpenAI|Codex)\s+(?:API|SDK|CLI)\b/g);
 add(/\bcodex\s+(?:--?[\w-]+|login|logout|app-server|mcp|resume|exec|review|fork|features|apply|completion|cloud|debug|sandbox|help|version|config)\b/g);
 // A middle dot inside an actual word or unit is content, not a UI divider
 // (Catalan "sol·licita", temperature unit "°C·kg/mol", or "mg·h/L").
 add(/\p{Script=Latin}+·\p{Script=Latin}+/gu);
 add(/\d·\d/g);
 spans.push(...icuMetadata(value).spans);
 return spans;
}

export function adaptVisibleMessage(value,id=null){
 if(id&&Object.hasOwn(sceneCopy,id))return {value:sceneCopy[id],kind:'sceneCopy'};
 const spans=protectedRanges(value);
 const protectedAt=offset=>spans.some(([a,b])=>a<=offset&&offset<b);
 // Product surfaces have their own names. Match the two-word name first so
 // the Work surface never becomes the awkward "姚同学 Work".
 let next=value.replace(/\bChatGPT\s+Work\b|\b(?:ChatGPT|Codex)\b/gi,(brand,offset)=>protectedAt(offset)?brand:/^ChatGPT\s+Work$/i.test(brand)?'视频工作':'姚同学');
 // These dots are display separators in vendor labels, not editing copy.
 // Leave masked card/account numbers and technical ranges untouched. Use a
 // plain comma between metadata fields, or a space for a standalone separator.
 const nextSpans=protectedRanges(next);
 const plainSeparator=/^[\s·•]+$/.test(next);
 next=next.replace(/[·•]/g,(dot,offset)=>{
  if(nextSpans.some(([a,b])=>a<=offset&&offset<b))return dot;
  if(dot==='•'&&(next[offset-1]==='•'||next[offset+1]==='•'))return dot;
  if(dot==='•'&&/(?:^|\n)\s*$/.test(next.slice(0,offset)))return '';
  return plainSeparator?' ':/[\u3400-\u9fff]/.test(next)?'，':' ';
 });
 next=next.replace(/\s+，\s*/g,'，').replace(/，\s+/g,'，');
 // OpenAI is the actual external provider and legal party in API, billing,
 // privacy, model and attribution messages. Keep that factual name rather than
 // falsely relabeling those dependencies or their terms as Tencent services.
 return {value:next,kind:'productBrandAndPlainCopy'};
}

function encode(value,quote){
 if(quote==='`')return '`'+value.replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${')+'`';
 return JSON.stringify(value);
}

export function applyVisibleCopy(name,source){
 if(!visibleCopySourceFiles.includes(name))return {source,changes:[]};
 const edits=[];
 for(const range of visibleMessageRanges(name,source)){
  const adapted=adaptVisibleMessage(range.value,range.id);
  if(adapted.value===range.value)continue;
  edits.push({...range,next:encode(adapted.value,range.quote),adaptation:adapted.kind});
 }
 if(!edits.length)return {source,changes:[]};
 let next=source;
 for(const edit of edits.toReversed())next=next.slice(0,edit.start)+edit.next+next.slice(edit.end);
 const counts={};
 for(const edit of edits){const key=edit.kind+':'+edit.adaptation;counts[key]=(counts[key]||0)+1;}
 return {source:next,changes:[{count:edits.length,counts,ids:[...new Set(edits.map(e=>e.id).filter(Boolean))],samples:edits.slice(0,4).map(e=>({id:e.id,kind:e.kind,before:e.value.slice(0,90),after:adaptVisibleMessage(e.value,e.id).value.slice(0,90)}))}]};
}
