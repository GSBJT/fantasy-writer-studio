import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen, Users, Globe2, Download, DatabaseBackup, Plus, Trash2, ImagePlus, Upload, Crown, PenLine, Map, Check, AlertTriangle, Menu} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { loadProject, saveProject, newProject, downloadBlob, safeFilename } from './storage';
import {languages} from './i18n';
import './style.css';

const icons={write:BookOpen,characters:Users,world:Globe2,export:Download,backup:DatabaseBackup};
function wordCount(text){return (text.trim().match(/\S+/g)||[]).length;}
function ItemImages({item, onChange,t}) {
  const input=useRef(null);
  async function addFiles(files){
    const next=[];
    for(const file of Array.from(files||[])){
      if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024){ alert(t.uploadHint); continue; }
      const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Image read failed'));r.readAsDataURL(file);});
      next.push({id:crypto.randomUUID(),name:file.name,data,note:''});
    }
    if(next.length)onChange({...item, images:[...(item.images||[]),...next],primaryImage:item.primaryImage||next[0].id});
    if(input.current)input.current.value='';
  }
  return <section className="imagearea">
    <div className="inline-between"><h3>{t.images} <small>({(item.images||[]).length})</small></h3><button type="button" className="btn secondary small" onClick={()=>input.current?.click()}><ImagePlus size={16}/>{t.upload}</button></div>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e=>addFiles(e.target.files)}/>
    <p className="hint">{t.uploadHint}</p>
    {(item.images||[]).length===0?<div className="empty-image">{t.empty}</div>:<div className="gallery">
      {item.images.map(img=><div className="picture" key={img.id}>
        <img src={img.data} alt={img.name}/>
        {img.id===item.primaryImage&&<span className="primary-badge"><Crown size={12}/> {t.cover}</span>}
        <input aria-label={t.prompt} value={img.note||''} placeholder={t.prompt} onChange={e=>onChange({...item,images:item.images.map(i=>i.id===img.id?{...i,note:e.target.value}:i)})}/>
        <div className="picture-actions"><button type="button" onClick={()=>onChange({...item,primaryImage:img.id})}><Crown size={14}/>{t.cover}</button><button type="button" className="danger-link" onClick={()=>{if(window.confirm(t.confirmDelete))onChange({...item,images:item.images.filter(i=>i.id!==img.id),primaryImage:item.primaryImage===img.id?(item.images.find(i=>i.id!==img.id)?.id||null):item.primaryImage});}}><Trash2 size={14}/>{t.remove}</button></div>
      </div>)}
    </div>}
  </section>;
}
function Catalog({items,kind,update,t}){
  const [active,setActive]=useState(null);
  useEffect(()=>{if(active&&!items.some(i=>i.id===active))setActive(null);},[items,active]);
  const current=items.find(i=>i.id===active);
  function newItem(){const id=crypto.randomUUID();update([...items,{id,name:kind==='characters'?'Нов герой':'Ново място',detail:'',description:'',images:[],primaryImage:null}]);setActive(id);}
  function patch(item){update(items.map(i=>i.id===item.id?item:i));}
  return <div className="catalog-layout">
    <div className="catalog-list"><button className="btn primary full" onClick={newItem}><Plus size={16}/>{kind==='characters'?t.newCharacter:t.newWorld}</button>
      {items.length===0&&<p className="hint">{kind==='characters'?t.noCharacters:t.noWorlds}</p>}
      {items.map(i=>{const img=(i.images||[]).find(x=>x.id===i.primaryImage)||(i.images||[])[0];return <button key={i.id} className={'catalog-row '+(active===i.id?'selected':'')} onClick={()=>setActive(i.id)}>{img?<img src={img.data} alt=""/>:<span className="avatar-placeholder">{kind==='characters'?'✦':'⌂'}</span>}<span>{i.name||'—'}</span></button>;})}
    </div>
    <div className="catalog-detail">{current?<>
      <div className="inline-between"><h2>{kind==='characters'?t.characters:t.world}</h2><button className="icon-danger" aria-label={t.remove} title={t.remove} onClick={()=>{if(window.confirm(t.confirmDelete))update(items.filter(i=>i.id!==current.id));}}><Trash2 size={18}/></button></div>
      <label>{kind==='characters'?t.name:t.location}<input value={current.name} onChange={e=>patch({...current,name:e.target.value})}/></label>
      <label>{kind==='characters'?t.role:t.category}<input value={current.detail||''} onChange={e=>patch({...current,detail:e.target.value})}/></label>
      <label>{t.description}<textarea rows={5} value={current.description||''} onChange={e=>patch({...current,description:e.target.value})}/></label>
      <ItemImages item={current} onChange={patch} t={t}/>
    </>:<div className="empty-state"><ImagePlus size={46}/><h2>{kind==='characters'?t.characters:t.world}</h2><p>{kind==='characters'?t.noCharacters:t.noWorlds}</p></div>}</div>
  </div>;
}
function App(){
 const [data,setData]=useState(null),[lang,setLang]=useState(localStorage.getItem('fws-lang')||'bg'),[tab,setTab]=useState('write');
 const [chapterId,setChapterId]=useState(null),[status,setStatus]=useState('saved'),[busy,setBusy]=useState(false),[mobileMenu,setMobileMenu]=useState(false);
 const fileRef=useRef(null); const dirty=useRef(false);const saveSeq=useRef(0);
 const t=languages[lang]||languages.bg;
 useEffect(()=>{loadProject().then(p=>{const v=p||newProject();setData(v);setChapterId(v.chapters[0]?.id||null);}).catch(e=>{console.error(e);setData(newProject());});},[]);
 useEffect(()=>{document.documentElement.lang=lang;localStorage.setItem('fws-lang',lang);},[lang]);
 useEffect(()=>{if(!data||!dirty.current)return;setStatus('saving'); const seq=++saveSeq.current;const timer=setTimeout(async()=>{
   try {await saveProject({...data,updatedAt:new Date().toISOString()});if(seq===saveSeq.current){dirty.current=false;setStatus('saved');}}
   catch(e){console.error(e);setStatus('error');}
 },650);return()=>clearTimeout(timer);},[data]);
 // Flush unsaved changes on tab hiding to reduce the chance of losing the last few keystrokes.
 const currentData=useRef(data);currentData.current=data;
 useEffect(()=>{const flush=()=>{if(dirty.current&&currentData.current)saveProject(currentData.current).catch(console.error);};document.addEventListener('visibilitychange',flush);window.addEventListener('pagehide',flush);return()=>{document.removeEventListener('visibilitychange',flush);window.removeEventListener('pagehide',flush);};},[]);
 function modify(fn){dirty.current=true;setData(p=>fn(p));}
 function editChapter(patch){modify(p=>({...p,chapters:p.chapters.map(c=>c.id===chapterId?{...c,...patch}:c)}));}
 function addChapter(){const c={id:crypto.randomUUID(),title:lang==='ko'?'새 챕터':'Нова глава',text:''};modify(p=>({...p,chapters:[...p.chapters,c]}));setChapterId(c.id);}
 async function exportDocx(){setBusy(true);try{
   const paragraphs=[new Paragraph({text:data.title||'',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER})];
   if(data.author)paragraphs.push(new Paragraph({text:data.author,alignment:AlignmentType.CENTER}));
   for(const [i,c] of data.chapters.entries()){
     paragraphs.push(new Paragraph({text:c.title||`Chapter ${i+1}`,heading:HeadingLevel.HEADING_1,pageBreakBefore:true}));
     for(const line of (c.text||'').split(/\r?\n/)) paragraphs.push(new Paragraph({children:[new TextRun({text:line||' '})],spacing:{after:120}}));
   }
   const doc=new Document({sections:[{properties:{page:{margin:{top:1100,bottom:1100,left:1100,right:1100}}},children:paragraphs}]});
   downloadBlob(await Packer.toBlob(doc),safeFilename(data.title)+'.docx');
 }catch(e){console.error(e);alert(t.error+': '+e.message);}finally{setBusy(false);}}
 async function exportPdf(){setBusy(true);let holder;try{
   const html2pdf=(await import('html2pdf.js')).default;
   holder=document.createElement('article');holder.className='pdf-document';
   const title=document.createElement('h1');title.textContent=data.title||'';holder.appendChild(title);
   if(data.author){const a=document.createElement('p');a.className='pdf-author';a.textContent=data.author;holder.appendChild(a);}
   data.chapters.forEach(c=>{const sec=document.createElement('section');sec.className='pdf-chapter';const h=document.createElement('h2');h.textContent=c.title;sec.appendChild(h);(c.text||'').split(/\r?\n/).forEach(line=>{const p=document.createElement('p');p.textContent=line||'\u00a0';sec.appendChild(p);});holder.appendChild(sec);});
   holder.style.cssText='position:fixed;left:-10000px;top:0;width:720px;padding:45px;background:white;color:#191919;font-family:Arial,"Noto Sans",sans-serif;font-size:15px;line-height:1.65;';
   document.body.appendChild(holder);
   await html2pdf().set({margin:[14,13,14,13],filename:safeFilename(data.title)+'.pdf',image:{type:'jpeg',quality:0.96},html2canvas:{scale:1.7,backgroundColor:'#ffffff',useCORS:true,windowWidth:900},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(holder).save();
 }catch(e){console.error(e);alert(t.error+': '+e.message);}finally{holder?.remove();setBusy(false);}}
 function backup(){downloadBlob(new Blob([JSON.stringify({...data,updatedAt:new Date().toISOString()},null,2)],{type:'application/json'}),safeFilename(data.title)+'-backup.json');}
 async function restore(file){if(!file)return;try{const p=JSON.parse(await file.text());if(!p||!Array.isArray(p.chapters)||!Array.isArray(p.characters)||!Array.isArray(p.worlds)||typeof p.title!=='string'||p.schemaVersion!==1)throw Error('schema');if(!window.confirm(t.confirmRestore))return;await saveProject(p);dirty.current=false;setData(p);setChapterId(p.chapters[0]?.id||null);setTab('write');setStatus('saved');alert(t.backupComplete);}catch(e){alert(t.invalidBackup);}finally{if(fileRef.current)fileRef.current.value='';}}
 if(!data)return <div className="loading">Fantasy Writer Studio…</div>;
 const chapter=data.chapters.find(c=>c.id===chapterId)||data.chapters[0];
 return <div className="app">
   <aside className={'sidebar '+(mobileMenu?'show':'')}>
     <div className="brand"><div className="brand-icon"><BookOpen/></div><div><strong>Fantasy Writer</strong><span>STUDIO · v0.1</span></div></div>
     <nav>{['write','characters','world','export','backup'].map(key=>{const Icon=icons[key];return <button key={key} className={'nav-item '+(tab===key?'active':'')} onClick={()=>{setTab(key);setMobileMenu(false);}}><Icon size={19}/>{t[key]}</button>;})}</nav>
     <div className="sidebar-bottom"><label>{t.language}<select value={lang} onChange={e=>setLang(e.target.value)}><option value="bg">🇧🇬 Български</option><option value="en">🇬🇧 English</option><option value="ko">🇰🇷 한국어</option></select></label><p className="small-warning"><AlertTriangle size={15}/>{t.autosave}</p></div>
   </aside>
   {mobileMenu&&<div className="scrim" onClick={()=>setMobileMenu(false)}/>}
   <main className="main">
     <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileMenu(true)} aria-label="Menu"><Menu/></button><div className="page-label">{t[tab]}</div><div className={'save-status '+(status==='error'?'error':'')}><span className="dot"/>{status==='saving'?t.saving:status==='error'?t.storageError:t.saved}</div></header>
     {tab==='write'&&<div className="writing-layout">
       <div className="chapter-sidebar"><div className="inline-between"><h3>{t.chapters}</h3><button className="round-add" onClick={addChapter} title={t.newChapter}><Plus size={18}/></button></div>
         {data.chapters.map((c,i)=><button key={c.id} className={'chapter-item '+(c.id===chapter?.id?'selected':'')} onClick={()=>setChapterId(c.id)}><span className="chapter-index">{String(i+1).padStart(2,'0')}</span><span>{c.title||'—'}</span></button>)}
       </div>
       <div className="editor-panel"><div className="editor-meta"><label>{t.title}<input value={data.title} onChange={e=>modify(p=>({...p,title:e.target.value}))}/></label><label>{t.author}<input value={data.author} onChange={e=>modify(p=>({...p,author:e.target.value}))}/></label></div>
        {chapter&&<><div className="chapter-heading"><input aria-label={t.chapterTitle} value={chapter.title} onChange={e=>editChapter({title:e.target.value})}/><button title={t.deleteChapter} className="icon-danger" disabled={data.chapters.length===1} onClick={()=>{if(window.confirm(t.confirmDelete)){const ix=data.chapters.findIndex(c=>c.id===chapter.id);modify(p=>({...p,chapters:p.chapters.filter(c=>c.id!==chapter.id)}));setChapterId(data.chapters[Math.max(0,ix-1)]?.id);}}}><Trash2 size={16}/></button></div>
        <textarea className="manuscript" spellCheck autoCapitalize="sentences" lang="bg" value={chapter.text} onChange={e=>editChapter({text:e.target.value})} placeholder={t.placeholder}/>
        <div className="editor-footer"><PenLine size={15}/> {wordCount(chapter.text)} {t.words} · {data.chapters.reduce((n,c)=>n+wordCount(c.text),0)} {t.words} (total)</div></>}
       </div>
     </div>}
     {tab==='characters'&&<Catalog items={data.characters} kind="characters" update={items=>modify(p=>({...p,characters:items}))} t={t}/>}
     {tab==='world'&&<Catalog items={data.worlds} kind="world" update={items=>modify(p=>({...p,worlds:items}))} t={t}/>}
     {tab==='export'&&<div className="settings-page"><h1>{t.export}</h1><p>{t.exportInfo}</p><div className="settings-card"><div className="format-icon">DOCX</div><div><h2>Microsoft Word</h2><p>{data.chapters.length} {t.chapters.toLowerCase()}</p></div><button className="btn primary" disabled={busy} onClick={exportDocx}><Download size={16}/>{t.exportDocx}</button></div><div className="settings-card"><div className="format-icon pdf">PDF</div><div><h2>PDF</h2><p>A4 · Български Unicode</p></div><button className="btn primary" disabled={busy} onClick={exportPdf}><Download size={16}/>{t.exportPdf}</button></div>{busy&&<p className="hint">{t.exportProgress}</p>}<p className="hint">PDF is rendered locally in your browser. For very long novels, export a shorter draft if browser memory becomes insufficient.</p></div>}
     {tab==='backup'&&<div className="settings-page"><h1>{t.backup}</h1><div className="warning-box"><AlertTriangle size={22}/><p>{t.backupWarning}</p></div><div className="settings-card"><div className="format-icon">JSON</div><div><h2>{t.backupDownload}</h2><p>{data.chapters.length} chapters · {data.characters.length} characters · {data.worlds.length} locations</p></div><button className="btn primary" onClick={backup}><Download size={16}/>{t.backupDownload}</button></div><div className="settings-card"><div className="format-icon"><Upload/></div><div><h2>{t.backupRestore}</h2><p>Import a previously downloaded project backup.</p></div><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={e=>restore(e.target.files?.[0])}/><button className="btn secondary" onClick={()=>fileRef.current?.click()}><Upload size={16}/>{t.backupRestore}</button></div></div>}
     <div className="mobile-note">{t.autosave}</div>
   </main>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
