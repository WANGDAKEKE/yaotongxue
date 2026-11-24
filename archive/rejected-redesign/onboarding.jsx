// A welcome-page extension. React and the completion bridge come from the host.
// This module never authenticates, starts inference, or changes the host router.
export function createPromoOnboarding(React) {
  const {useState, useEffect, useRef} = React;
  const STORAGE_KEY = 'yingqing.onboarding.v1';
  const roles = [
    {id:'strategy', title:'宣发策划', detail:'定方向，找切口', symbol:'◎'},
    {id:'operations', title:'内容运营', detail:'选物料，看传播', symbol:'↗'},
    {id:'editing', title:'剪辑制作', detail:'控节奏，成版本', symbol:'⌘'},
    {id:'review', title:'审片管理', detail:'看成片，提修改', symbol:'▤'}
  ];
  const materials = ['剧情钩子','人物高光','关系看点','情绪片段','主题混剪'];
  function initialProfile() {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {displayName: typeof p.displayName === 'string' ? p.displayName.slice(0,32) : '', role: roles.some(r=>r.id===p.role) ? p.role : '', materials: Array.isArray(p.materials) ? p.materials.filter(m=>materials.includes(m)) : []};
    } catch { return {displayName:'',role:'',materials:[]}; }
  }
  function Mark({className=''}) {
    return <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6.1225 23.5028C6.801 28.0786 7.61233 31.518 12.9034 29.8054C17.9778 28.1705 22.8601 25.2644 27.1477 21.9701C28.6845 20.6519 31.3638 18.7922 31.4169 16.6075C31.3638 14.4146 28.6845 12.5631 27.1477 11.2429C22.856 7.94851 17.9778 5.04855 12.9034 3.40545C7.61233 1.69695 6.801 5.13848 6.1225 9.71014C5.59523 14.2926 5.59523 18.9204 6.1225 23.5028Z" fill="#0098FF" /><path d="M1.5054 10.5641C2.0858 7.53743 2.9564 5.34049 6.85775 6.0946C6.52076 7.27918 6.27481 8.48778 6.12203 9.70984C5.59681 14.2924 5.59681 18.9199 6.12203 23.5025C6.27601 24.7244 6.52194 25.9329 6.85775 27.1177C2.95844 27.8718 2.08784 25.6749 1.5054 22.6482L1.46452 22.4316L1.38688 21.9943C0.896432 18.4189 0.896432 14.7934 1.38688 11.2181L1.46452 10.7807L1.5054 10.5641Z" fill="#FF8800" /><path d="M6.85821 6.09277C7.12798 6.14591 7.41409 6.21131 7.72881 6.29714C12.4619 7.57851 17.0213 9.84493 21.0249 12.4179C22.4554 13.4499 24.9569 14.8969 25.0059 16.6094C24.9569 18.322 22.4534 19.7689 21.0249 20.7989C17.0213 23.3719 12.4619 25.6404 7.72881 26.9197C7.44221 27.0023 7.15165 27.0706 6.85821 27.1241C6.52143 25.9388 6.27548 24.7295 6.1225 23.5068C5.59523 18.9244 5.59523 14.2966 6.1225 9.71414C6.27562 8.49934 6.5195 7.29771 6.85209 6.11934L6.85821 6.09277Z" fill="#43E700" /><path d="M9.65007 12.2585C9.65007 12.2585 9.35986 12.7286 9.35986 16.6156C9.35986 20.5026 9.65007 20.9482 9.65007 20.9482C9.74817 21.4305 9.94027 21.5837 10.4675 21.4611C10.4675 21.4611 11.3381 21.3262 14.8164 19.5564C18.2947 17.7866 18.8751 17.1183 18.8751 17.1183C19.2491 16.7403 19.3493 16.4889 18.8751 16.0965C18.8751 16.0965 17.9187 15.2136 14.8164 13.6053C11.7142 11.9969 10.4675 11.7456 10.4675 11.7456C10.0404 11.6229 9.76452 11.7619 9.65007 12.2585Z" fill="white" /></svg>;
  }
  function Penguin() {
    return <svg viewBox="0 0 80 100" aria-hidden="true"><path d="M16 89c-17-8-15-23-9-31 3-8 3-14 3-22C10 14 22 1 39 1s29 13 29 35c0 8 0 14 3 22 6 8 8 23-9 31H16Z" fill="currentColor"/><ellipse cx="39" cy="57" rx="19" ry="27" fill="#151619"/><circle cx="29" cy="26" r="3" fill="#151619"/><circle cx="48" cy="26" r="3" fill="#151619"/><path d="m33 35 6 5 6-5M21 87l-10 7M57 87l10 7" stroke="currentColor" strokeWidth="4" fill="none"/></svg>;
  }
  function Arrow() { return <span aria-hidden="true">↗</span>; }
  function StoryGraph({compact=false}) {
    return <div className={'yq-graph '+(compact?'is-compact':'')} aria-label="示例：人物、关系、故事线关联到原片镜头">
      <svg className="yq-graph-lines" viewBox="0 0 400 210" preserveAspectRatio="none" aria-hidden="true"><path d="M200 105 66 48M200 105 334 48M200 105 68 172M200 105 332 172"/><path d="M66 48C120 5 274 5 334 48M68 172C130 212 270 212 332 172" strokeDasharray="3 5"/><circle cx="200" cy="105" r="45" strokeDasharray="2 8"/></svg>
      <div className="yq-graph-node n-center"><Mark/><small>故事主线</small></div>
      <div className="yq-graph-node n-one"><span>人物 A</span><small>身份 · 动机</small></div>
      <div className="yq-graph-node n-two"><span>人物 B</span><small>关系 · 变化</small></div>
      <div className="yq-graph-node n-three"><span>剧情事件</span><small>起因 → 结果</small></div>
      <div className="yq-graph-node n-four"><span>原片证据</span><small>画面 + 台词 + 声音</small></div>
      <span className="yq-edge e-one">关系</span><span className="yq-edge e-two">因果</span>
    </div>;
  }
  function HeroVisual() {
    return <div className="yq-hero-visual" aria-label="一部剧经过内容理解，产生多种宣发方向的流程示意">
      <div className="yq-visual-top"><span className="yq-live-dot"/> CONTENT → CREATIVE <span>01 / N</span></div>
      <div className="yq-source-strip"><span>剧集资产</span><b>EP.01</b><b>EP.02</b><b>EP.03</b><i>···</i><b>EP.N</b></div>
      <StoryGraph/>
      <div className="yq-output-label"><span>一部剧，多种打开方式</span><span>↘</span></div>
      <div className="yq-output-cards">{[['01','剧情钩子','先抓住下一秒'],['02','人物高光','让表演被看见'],['03','关系看点','把情绪带进去']].map(([num,title,sub])=><div className="yq-output-card" key={num}><span>{num}</span><div className="yq-mini-play">▷</div><strong>{title}</strong><small>{sub}</small></div>)}</div>
      <div className="yq-visual-bottom"><span>理解 / 检索 / 音画 / 节奏</span><span>WORKFLOW PREVIEW</span></div>
    </div>;
  }
  const demoContent = [
    {title:'先把人和故事对上',body:'结合画面、台词与声音，串起人物关系和跨集剧情。关键判断都能回到原片核对。',tags:['人物与演员','跨集因果','原片音画'],number:'01',label:'读懂全剧'},
    {title:'同一部剧，试出不同看点',body:'从目标观众出发，把剧情冲突、表演和情绪变成创作方向，再用真实素材验证。',tags:['剧情钩子','人物高光','情绪张力'],number:'02',label:'找到切口'},
    {title:'直接看成片，意见落到镜头',body:'对比叙事、节奏、字卡和声音。保留有效镜头，定位需要修改的片段，继续迭代。',tags:['多版预览','镜头溯源','局部修订'],number:'03',label:'看版精修'}
  ];
  function DemoVisual({tab}) {
    if(tab===0) return <div className="yq-demo-visual"><div className="yq-panel-heading"><span>CONTENT MAP</span><small>示例结构</small></div><StoryGraph compact/><div className="yq-evidence"><div className="yq-evidence-icon">◧</div><div><b>每一个判断，都有原片依据</b><small>集数 / 镜头 / 台词 / 时间码</small></div><span>↗</span></div></div>;
    if(tab===1) return <div className="yq-demo-visual"><div className="yq-panel-heading"><span>CREATIVE DIRECTIONS</span><small>方向可组合</small></div><div className="yq-direction-list">{[['A','冲突悬念','开场立冲突，结尾留问题','剧情钩子'],['B','演员高光','真实表演与原声，放大人物魅力','人物向'],['C','人物关系','交代因果，让情绪逐步升级','情绪向']].map(([n,title,sub,tag])=><div key={n}><span>{n}</span><section><b>{title}</b><small>{sub}</small></section><em>{tag}</em></div>)}</div><div className="yq-demo-footnote">一部剧的多个方向，共享同一套内容证据。</div></div>;
    return <div className="yq-demo-visual"><div className="yq-panel-heading"><span>REVIEW & REFINE</span><small>示意时间线</small></div><div className="yq-review-view"><div className="yq-review-play">▷</div><div><b>版本 B · 人物高光</b><small>原声与画面一起，决定剪口</small></div><span>00:18</span></div><div className="yq-timeline"><div className="yq-timeline-ruler"><span>00:00</span><span>00:10</span><span>00:20</span></div>{[['画面','shots'],['原声','audio'],['字卡','captions'],['音乐','music']].map(([label,kind])=><div className={'yq-track '+kind} key={kind}><label>{label}</label><div>{[0,1,2,3,4].map((n)=><i key={n}/>)}</div></div>)}<div className="yq-playhead"/></div><div className="yq-review-note"><span>↳</span> 开头更快进入冲突，保留这句原声。</div></div>;
  }
  return function PromoOnboarding({onComplete}) {
    const [step,setStep]=useState(0);
    const [profile,setProfile]=useState(initialProfile);
    const [tab,setTab]=useState(0);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const headingRef=useRef(null);
    useEffect(()=>{headingRef.current?.focus({preventScroll:true});},[step]);
    function update(key,value){setProfile(p=>({...p,[key]:value}));}
    function toggleMaterial(m){update('materials',profile.materials.includes(m)?profile.materials.filter(v=>v!==m):[...profile.materials,m]);}
    async function finish(){
      if(busy)return;
      setBusy(true);setError('');
      // Optional preferences must never block entry when local storage is unavailable.
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,...profile,completedAt:new Date().toISOString()}));}catch{}
      try{
        await onComplete?.(profile);
      }catch(e){setError('暂时无法进入工作台，请重试。');setBusy(false);}
    }
    return <main className="yq-root" lang="zh-CN">
      <header className="yq-header"><div className="yq-brand"><Mark/><div><strong>姚同学</strong><small>腾讯视频 · VIDEO PROMO AGENT</small></div></div><nav aria-label="新人引导进度">{['认识姚同学','工作偏好','流程演示'].map((label,n)=><button key={label} disabled={busy||n>step} onClick={()=>setStep(n)} className={n===step?'active':n<step?'done':''} aria-current={n===step?'step':undefined}><span>{n<step?'✓':String(n+1).padStart(2,'0')}</span><em>{label}</em></button>)}</nav></header>
      <div className={'yq-page yq-step-'+step} key={step}>
        {step===0?<div className="yq-welcome"><section className="yq-intro"><div className="yq-eyebrow"><span/> 长视频宣发 · 创作工作台</div><h1 tabIndex="-1" ref={headingRef}>让好故事，<br/>拥有更多<br/><span>打开方式。</span></h1><p>从一部剧出发，读懂人物与剧情，<br className="yq-desktop-br"/>围绕不同看点，制作多版宣发素材。</p><div className="yq-intro-tags"><span>读懂故事</span><i>/</i><span>找准看点</span><i>/</i><span>剪成物料</span></div></section><HeroVisual/></div>:null}
        {step===1?<section className="yq-profile"><div className="yq-eyebrow">为你的工作，留一个顺手的入口</div><h1 tabIndex="-1" ref={headingRef}>你主要负责哪一环？</h1><p className="yq-section-copy">留下一点偏好，方便后续设置工作台。都可跳过。</p><div className="yq-profile-name"><label htmlFor="yq-name">怎么称呼你 <small>选填</small></label><input id="yq-name" value={profile.displayName} onChange={e=>update('displayName',e.target.value)} placeholder="输入昵称" maxLength={32} autoComplete="off"/></div><div className="yq-role-grid" role="group" aria-label="工作侧重">{roles.map(role=><button key={role.id} className={profile.role===role.id?'selected':''} aria-pressed={profile.role===role.id} onClick={()=>update('role',profile.role===role.id?'':role.id)}><span className="yq-role-symbol">{role.symbol}</span><div><strong>{role.title}</strong><small>{role.detail}</small></div><span className="yq-choice-mark">{profile.role===role.id?'✓':'+'}</span></button>)}</div><div className="yq-materials"><label>平时常做哪些物料？ <small>可多选</small></label><div>{materials.map(m=><button key={m} onClick={()=>toggleMaterial(m)} aria-pressed={profile.materials.includes(m)} className={profile.materials.includes(m)?'selected':''}>{m}<span>{profile.materials.includes(m)?'✓':'+'}</span></button>)}</div></div><div className="yq-local-note"><span>◌</span> 偏好仅保存在本机，随本机应用数据保留。</div></section>:null}
        {step===2?<section className="yq-demo"><div className="yq-demo-title"><div className="yq-eyebrow">看一次完整工作方式</div><h1 tabIndex="-1" ref={headingRef}>从整部剧，到多版宣发素材。</h1><p className="yq-section-copy">同一套内容证据，支撑不同创作方向。看成片，再精修。</p></div><div className="yq-demo-card"><div className="yq-demo-tabs" role="tablist" aria-label="流程演示">{demoContent.map((c,n)=><button role="tab" id={'yq-tab-'+n} aria-controls="yq-demo-panel" aria-selected={tab===n} key={c.label} onClick={()=>setTab(n)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(tab+(e.key==='ArrowRight'?1:2))%3;setTab(next);document.getElementById('yq-tab-'+next)?.focus();}}} tabIndex={tab===n?0:-1} className={tab===n?'active':''}><span>{c.number}</span>{c.label}<i>↗</i></button>)}</div><div className="yq-demo-body" role="tabpanel" id="yq-demo-panel" aria-labelledby={'yq-tab-'+tab}><section className="yq-demo-description"><div className="yq-demo-label"><span/> 示例演示 · 非实时生成</div><h2>{demoContent[tab].title}</h2><p>{demoContent[tab].body}</p><div className="yq-demo-tags">{demoContent[tab].tags.map(t=><span key={t}>{t}</span>)}</div><button className="yq-next-demo" onClick={()=>setTab((tab+1)%3)}>查看下一段 <span>→</span></button></section><DemoVisual tab={tab}/></div></div><div className="yq-demo-note">当前为界面与流程预览。接入模型及媒体工具后，才能执行真实剪辑任务。</div></section>:null}
      </div>
      <footer className="yq-footer"><div className="yq-footer-note"><Penguin/><div><strong>姚同学 <span>LOCAL PREVIEW</span></strong><small>{step===0?'为腾讯视频长视频宣发而设计':step===1?'这里只收集工作偏好，不设置单个剧目的创作限制':'保留原片依据，让创作可以追溯与修订'}</small></div></div><div className="yq-actions">{step>0?<button className="yq-button yq-ghost" onClick={()=>setStep(step-1)} disabled={busy}>返回</button>:<button className="yq-button yq-ghost" onClick={()=>setStep(2)}>先看演示</button>}{step===1?<button className="yq-button yq-skip" onClick={()=>setStep(2)}>暂时跳过</button>:null}<button className="yq-button yq-primary" onClick={step===2?finish:()=>setStep(step+1)} disabled={busy}>{busy?'正在进入…':step===0?'开始设置':step===1?'继续':'进入工作台'}<Arrow/></button></div></footer>
      {error?<div className="yq-error" role="alert">{error}<button onClick={()=>setError('')} aria-label="关闭错误提示">×</button></div>:null}
    </main>;
  };
}
