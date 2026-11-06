import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BookOpen,Users,Globe2,Download,DatabaseBackup,Plus,Trash2,ImagePlus,Upload,Crown,PenLine,Check,AlertTriangle,Menu,Library,FolderPlus,ArrowLeft,Images} from 'lucide-react';
import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType} from 'docx';
import {loadLibrary,saveLibrary,getLegacySnapshot,exportLegacySnapshot,downloadBlob,safeFilename} from './storage';
import {freshBook,activeBook,patchBook,removeBook,selectBook,validLibrary,upgradeBackup} from './model';
import {languages} from './i18n';
import {extra} from './i18n-v2';
import './style.css';
import {WorldHierarchy,RelationshipChart,Timeline,ImageLibrary,PromptNotes,CloudBackup,words} from './features.jsx';
import MapStudio2 from './MapStudio2.jsx';
const icons={library:Library,write:BookOpen,characters:Users,world:Globe2,export:Download,backup:DatabaseBackup};
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
 const [lib,setLib]=useState(null),[loadError,setLoadError]=useState(''),[lang,setLang]=useState(localStorage.getItem('fws-lang')||'bg'),[tab,setTab]=useState('library');
 const [chapterId,setChapterId]=useState(null),[status,setStatus]=useState('saved'),[busy,setBusy]=useState(false),[mobileMenu,setMobileMenu]=useState(false);
 const [hasLegacy,setHasLegacy]=useState(false);
 const backupInput=useRef(null),coverInput=useRef(null),currentLib=useRef(null),writeTimer=useRef(null),seq=useRef(0),pending=useRef(false);
 const t={...(languages[lang]||languages.bg),...(extra[lang]||extra.bg),...(words[lang]||words.bg)};
 const book=lib?activeBook(lib):null;
 useEffect(()=>{let live=true;loadLibrary().then(async value=>{if(!live)return;setLib(value);setChapterId(activeBook(value).chapters[0]?.id||null);setHasLegacy(Boolean(await getLegacySnapshot()));}).catch(e=>{console.error(e);if(live)setLoadError(e.message);});return()=>{live=false;};},[]);
 useEffect(()=>{document.documentElement.lang=lang;localStorage.setItem('fws-lang',lang);},[lang]);
 currentLib.current=lib;
 function mutate(fn){setLib(prev=>{const next=fn(prev);if(next!==prev){pending.current=true;setStatus('saving');}return next;});}
 function updateBook(fn){mutate(prev=>patchBook(prev,prev.activeBookId,fn));}
 // Debounce writes; saveLibrary serializes writes so a slow write cannot overwrite a newer edit.
 useEffect(()=>{if(!lib||!pending.current)return;const revision=++seq.current;clearTimeout(writeTimer.current);writeTimer.current=setTimeout(async()=>{
   try{await saveLibrary(lib);if(revision===seq.current){pending.current=false;setStatus('saved');}}catch(err){console.error(err);setStatus('error');}
 },500);return()=>clearTimeout(writeTimer.current);},[lib]);
 useEffect(()=>{const flush=()=>{if(pending.current&&currentLib.current)saveLibrary(currentLib.current).catch(e=>{console.error(e);setStatus('error');});};
   const onHide=()=>{if(document.visibilityState==='hidden')flush();};document.addEventListener('visibilitychange',onHide);window.addEventListener('pagehide',flush);
   return()=>{document.removeEventListener('visibilitychange',onHide);window.removeEventListener('pagehide',flush);};},[]);
 async function ensureSaved(){clearTimeout(writeTimer.current);if(currentLib.current){await saveLibrary(currentLib.current);pending.current=false;setStatus('saved');}}
 function navigate(key){setTab(key);setMobileMenu(false);}
 function choose(id){mutate(v=>selectBook(v,id));const next=lib.books.find(b=>b.id===id);setChapterId(next?.chapters?.[0]?.id||null);navigate('write');}
 function makeBook(){const title=window.prompt(t.newBookTitle,lang==='ko'?'새 소설':'Нов роман');if(!title?.trim())return;const item=freshBook(undefined,title.trim());mutate(v=>({...v,books:[...v.books,item],activeBookId:item.id}));setChapterId(item.chapters[0].id);navigate('write');}
 function renameBook(id){const target=lib.books.find(b=>b.id===id);const title=window.prompt(t.renameBook,target.title);if(title?.trim())mutate(v=>patchBook(v,id,b=>({...b,title:title.trim()})));}
 async function deleteBook(id){if(lib.books.length===1){alert(t.oneBookOnly);return;}if(!window.confirm(t.deleteBookWarning))return;
   try{await ensureSaved();mutate(v=>removeBook(v,id));if(lib.activeBookId===id){const next=lib.books.find(b=>b.id!==id);setChapterId(next?.chapters[0]?.id||null);}navigate('library');}catch(e){alert(t.error+': '+e.message);}}
 function newSeries(){const name=window.prompt(t.newSeriesTitle);if(!name?.trim())return;mutate(v=>({...v,series:[...v.series,{id:crypto.randomUUID(),name:name.trim()}]}));}
 function removeSeries(id){if(!window.confirm(t.confirmSeriesDelete))return;mutate(v=>({...v,series:v.series.filter(s=>s.id!==id),books:v.books.map(b=>b.seriesId===id?{...b,seriesId:null}:b)}));}
 function patchChapter(patch){updateBook(b=>({...b,chapters:b.chapters.map(c=>c.id===chapterId?{...c,...patch}:c)}));}
 function addChapter(){const c={id:crypto.randomUUID(),title:lang==='ko'?'새 챕터':'Нова глава',text:''};updateBook(b=>({...b,chapters:[...b.chapters,c]}));setChapterId(c.id);}
 async function uploadCover(file){if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){alert(t.coverHint);return;}
   try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Image read failed'));r.readAsDataURL(file);});updateBook(b=>({...b,coverImage:{name:file.name,data}}));}catch(e){alert(t.error+': '+e.message);}finally{if(coverInput.current)coverInput.current.value='';}}
 async function exportDocx(){setBusy(true);try{
   const paragraphs=[new Paragraph({text:book.title||'',heading:HeadingLevel.TITLE,alignment:AlignmentType.CENTER})];
   if(book.author)paragraphs.push(new Paragraph({text:book.author,alignment:AlignmentType.CENTER}));
   for(const [i,c] of book.chapters.entries()){
     paragraphs.push(new Paragraph({text:c.title||`Chapter ${i+1}`,heading:HeadingLevel.HEADING_1,pageBreakBefore:true}));
     for(const line of(c.text||'').split(/\r?\n/))paragraphs.push(new Paragraph({children:[new TextRun({text:line||' '})],spacing:{after:120}}));
   }
   downloadBlob(await Packer.toBlob(new Document({sections:[{properties:{page:{margin:{top:1100,bottom:1100,left:1100,right:1100}}},children:paragraphs}]})),safeFilename(book.title)+'.docx');
 }catch(e){console.error(e);alert(t.error+': '+e.message);}finally{setBusy(false);}}
 async function exportPdf(){setBusy(true);let holder;try{
   const html2pdf=(await import('html2pdf.js')).default;holder=document.createElement('article');holder.className='pdf-document';
   const h=document.createElement('h1');h.textContent=book.title;holder.append(h);
   if(book.author){const a=document.createElement('p');a.className='pdf-author';a.textContent=book.author;holder.append(a);}
   book.chapters.forEach(c=>{const section=document.createElement('section');section.className='pdf-chapter';const ch=document.createElement('h2');ch.textContent=c.title;section.append(ch);for(const line of(c.text||'').split(/\r?\n/)){const p=document.createElement('p');p.textContent=line||'\u00a0';section.append(p);}holder.append(section);});
   holder.style.cssText='position:fixed;left:0;top:0;z-index:-1;width:720px;padding:45px;background:white;color:#191919;font-family:Arial,"Noto Sans",sans-serif;font-size:15px;line-height:1.65;pointer-events:none;';
   document.body.append(holder);
   await html2pdf().set({margin:[14,13,14,13],filename:safeFilename(book.title)+'.pdf',image:{type:'jpeg',quality:.96},html2canvas:{scale:1.7,backgroundColor:'#ffffff',useCORS:true,windowWidth:900},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy']}}).from(holder).save();
 }catch(e){console.error(e);alert(t.error+': '+e.message);}finally{holder?.remove();setBusy(false);}}
 async function backup(){try{await ensureSaved();downloadBlob(new Blob([JSON.stringify(lib,null,2)],{type:'application/json'}),'fantasy-writer-all-novels-v02-'+new Date().toISOString().slice(0,10)+'.json');}catch(e){alert(t.error+': '+e.message);}}
 async function restore(file){if(!file)return;try{
   const parsed=JSON.parse(await file.text());const next=upgradeBackup(parsed);if(!validLibrary(next))throw Error('schema');
   if(!window.confirm(t.replaceAll))return;
   // Write first: if quota exceeded, leave current UI and stored library intact.
   await saveLibrary(next);pending.current=false;clearTimeout(writeTimer.current);++seq.current;setLib(next);setChapterId(activeBook(next).chapters[0]?.id||null);navigate('library');setStatus('saved');alert(t.backupComplete);
 }catch(e){console.error(e);alert(t.restoreError+' '+e.message);}finally{if(backupInput.current)backupInput.current.value='';}}
 if(loadError)return <div className="loading"><AlertTriangle/> {t.storageError}<p>{loadError}</p><p>{lang==='ko'?'기존 브라우저 데이터를 삭제하지 말고 백업 후 오류를 확인하세요.':'Do not clear browser storage. Diagnose the error first.'}</p></div>;
 if(!lib)return <div className="loading">Fantasy Writer Studio…</div>;
 const chapter=book.chapters.find(c=>c.id===chapterId)||book.chapters[0];
 return <div className="app">
   <aside className={'sidebar '+(mobileMenu?'show':'')}>
     <div className="brand"><div className="brand-icon"><BookOpen/></div><div><strong>Fantasy Writer</strong><span>STUDIO · v1.0 dev</span></div></div>
     <nav>{['library','write','characters','world','hierarchy','relations','assets','map','timeline','ai','cloud','export','backup'].map(key=>{const Icon=icons[key]||({hierarchy:Globe2,relations:Users,assets:Images,map:Globe2,timeline:BookOpen,ai:PenLine,cloud:DatabaseBackup})[key];return <button key={key} className={'nav-item '+(tab===key?'active':'')} onClick={()=>navigate(key)}><Icon size={19}/>{t[key]}</button>;})}</nav>
     <div className="sidebar-bottom"><label>{t.language}<select value={lang} onChange={e=>setLang(e.target.value)}><option value="bg">🇧🇬 Български</option><option value="en">🇬🇧 English</option><option value="ko">🇰🇷 한국어</option></select></label><p className="small-warning"><AlertTriangle size={15}/>{t.savedLocally}</p></div>
   </aside>
   {mobileMenu&&<div className="scrim" onClick={()=>setMobileMenu(false)}/>}
   <main className="main">
     <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileMenu(true)} aria-label="Menu"><Menu/></button><div className="page-label">{t[tab]}</div><button className="active-book-chip" onClick={()=>navigate('library')} title={t.selectBook}><Library size={15}/><span>{book.title}</span></button><div className={'save-status '+(status==='error'?'error':'')}><span className="dot"/>{status==='saving'?t.saving:status==='error'?t.storageError:t.saved}</div></header>
     {tab==='library'&&<div className="library-page">
       <div className="inline-between library-title"><div><h1>{t.library}</h1><p className="hint">{t.libraryHint}</p></div><button className="btn primary" onClick={makeBook}><Plus size={17}/>{t.newBook}</button></div>
       <section className="series-toolbar"><strong>{t.series}</strong><button className="btn secondary small" onClick={newSeries}><Plus size={15}/>{t.newSeries}</button>
         {lib.series.map(s=><span className="series-pill" key={s.id}>{s.name}<button aria-label={t.remove} title={t.remove} onClick={()=>removeSeries(s.id)}>×</button></span>)}
       </section>
       <div className="book-grid">{lib.books.map(b=><article className={'book-card '+(b.id===lib.activeBookId?'chosen':'')} key={b.id}>
         <button className="book-cover" onClick={()=>choose(b.id)} aria-label={t.chooseBook}>{b.coverImage?.data?<img src={b.coverImage.data} alt={b.title}/>:<BookOpen size={50}/>}</button>
         <div className="book-card-body"><h2>{b.title}</h2><p>{lib.series.find(s=>s.id===b.seriesId)?.name||t.noSeries}{b.volume?' · '+b.volume:''}</p><p>{b.chapters.length} {t.chapters.toLowerCase()} · {b.characters.length} {t.characters.toLowerCase()}</p>
           <div className="book-actions"><button className="btn primary small" onClick={()=>choose(b.id)}>{t.chooseBook}</button><button className="btn secondary small" onClick={()=>renameBook(b.id)}>{t.rename}</button><button className="icon-danger" title={t.deleteBook} onClick={()=>deleteBook(b.id)} disabled={lib.books.length===1}><Trash2 size={17}/></button></div>
         </div>
       </article>)}</div>
     </div>}
     {tab==='write'&&<div className="writing-layout">
       <div className="chapter-sidebar"><div className="inline-between"><h3>{t.chapters}</h3><button className="round-add" onClick={addChapter} title={t.newChapter}><Plus size={18}/></button></div>
         {book.chapters.map((c,i)=><button key={c.id} className={'chapter-item '+(c.id===chapter?.id?'selected':'')} onClick={()=>setChapterId(c.id)}><span className="chapter-index">{String(i+1).padStart(2,'0')}</span><span>{c.title||'—'}</span></button>)}
       </div>
       <div className="editor-panel"><div className="editor-meta"><label>{t.title}<input value={book.title} onChange={e=>updateBook(b=>({...b,title:e.target.value}))}/></label><label>{t.author}<input value={book.author||''} onChange={e=>updateBook(b=>({...b,author:e.target.value}))}/></label></div>
        <div className="book-extra"><div className="cover-editor">{book.coverImage?.data&&<img src={book.coverImage.data} alt={t.bookCover}/>}<input ref={coverInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>uploadCover(e.target.files?.[0])}/><button className="btn secondary small" onClick={()=>coverInput.current?.click()}><ImagePlus size={15}/>{t.addCover}</button>{book.coverImage&&<button className="btn secondary small" onClick={()=>{if(window.confirm(t.confirmDelete))updateBook(b=>({...b,coverImage:null}));}}>{t.removeCover}</button>}</div>
        <label>{t.series}<select value={book.seriesId||''} onChange={e=>updateBook(b=>({...b,seriesId:e.target.value||null}))}><option value="">{t.noSeries}</option>{lib.series.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>{t.volume}<input value={book.volume||''} placeholder="1" onChange={e=>updateBook(b=>({...b,volume:e.target.value}))}/></label></div>
        {chapter&&<><div className="chapter-heading"><input aria-label={t.chapterTitle} value={chapter.title} onChange={e=>patchChapter({title:e.target.value})}/><button title={t.deleteChapter} className="icon-danger" disabled={book.chapters.length===1} onClick={()=>{if(window.confirm(t.confirmDelete)){const ix=book.chapters.findIndex(c=>c.id===chapter.id);updateBook(b=>({...b,chapters:b.chapters.filter(c=>c.id!==chapter.id)}));setChapterId(book.chapters[Math.max(0,ix-1)]?.id);}}}><Trash2 size={16}/></button></div>
        <textarea className="manuscript" spellCheck autoCapitalize="sentences" lang="bg" value={chapter.text} onChange={e=>patchChapter({text:e.target.value})} placeholder={t.placeholder}/>
        <div className="editor-footer"><PenLine size={15}/> {wordCount(chapter.text)} {t.words} · {book.chapters.reduce((n,c)=>n+wordCount(c.text),0)} {t.words} (total)</div></>}
       </div>
     </div>}
     {tab==='characters'&&<Catalog key={'c'+book.id} items={book.characters} kind="characters" update={items=>updateBook(b=>({...b,characters:items}))} t={t}/>}
     {tab==='world'&&<Catalog key={'w'+book.id} items={book.worlds} kind="world" update={items=>updateBook(b=>({...b,worlds:items}))} t={t}/>}
     {tab==='hierarchy'&&<WorldHierarchy book={book} update={updateBook} lang={lang}/>}
     {tab==='relations'&&<RelationshipChart book={book} update={updateBook} lang={lang}/>}
     {tab==='assets'&&<ImageLibrary book={book} update={updateBook} lang={lang}/>}
     {tab==='map'&&<MapStudio2 key={book.id} book={book} update={updateBook} lang={lang}/>}
     {tab==='timeline'&&<Timeline book={book} update={updateBook} lang={lang}/>}
     {tab==='ai'&&<PromptNotes book={book} update={updateBook} lang={lang}/>}
     {tab==='cloud'&&<CloudBackup lang={lang} lib={lib} saveBefore={ensureSaved} restoreFrom={async data=>{const next=upgradeBackup(data);if(!validLibrary(next))throw Error('Invalid cloud backup');await saveLibrary(next);pending.current=false;clearTimeout(writeTimer.current);++seq.current;setLib(next);setChapterId(activeBook(next).chapters[0]?.id||null);navigate('library');}}/>}
     {tab==='export'&&<div className="settings-page"><h1>{t.export}</h1><p><strong>{book.title}</strong> — {t.exportCurrent}</p><p>{t.exportInfo}</p>
        <div className="settings-card"><div className="format-icon">DOCX</div><div><h2>Microsoft Word</h2><p>{book.chapters.length} {t.chapters.toLowerCase()}</p></div><button className="btn primary" disabled={busy} onClick={exportDocx}><Download size={16}/>{t.exportDocx}</button></div>
        <div className="settings-card"><div className="format-icon pdf">PDF</div><div><h2>PDF</h2><p>A4 · Български Unicode</p></div><button className="btn primary" disabled={busy} onClick={exportPdf}><Download size={16}/>{t.exportPdf}</button></div>{busy&&<p className="hint">{t.exportProgress}</p>}
        <p className="hint">PDF generation runs in your browser. Very long books can exceed mobile memory; use Word if PDF fails. Character and location images are included in the complete JSON backup, not the manuscript exports.</p>
       </div>}
     {tab==='backup'&&<div className="settings-page"><h1>{t.backup}</h1><div className="warning-box"><AlertTriangle size={22}/><p>{t.backupWarning}</p></div>
        <div className="settings-card"><div className="format-icon">JSON</div><div><h2>{t.backupAll}</h2><p>{lib.books.length} {t.library.toLowerCase()} · {lib.books.reduce((n,b)=>n+b.chapters.length,0)} {t.chapters.toLowerCase()} · {lib.books.reduce((n,b)=>n+b.characters.length,0)} {t.characters.toLowerCase()}</p></div><button className="btn primary" onClick={backup}><Download size={16}/>{t.backupAll}</button></div>
        <div className="settings-card"><div className="format-icon"><Upload/></div><div><h2>{t.restoreAll}</h2><p>v0.1 / v0.2 JSON</p></div><input ref={backupInput} hidden type="file" accept="application/json,.json" onChange={e=>restore(e.target.files?.[0])}/><button className="btn secondary" onClick={()=>backupInput.current?.click()}><Upload size={16}/>{t.backupRestore}</button></div>
        {hasLegacy&&<div className="settings-card"><div className="format-icon">v0.1</div><div><h2>{t.originalBackup}</h2><p>Unmodified snapshot from initial migration.</p></div><button className="btn secondary" onClick={()=>exportLegacySnapshot().catch(e=>alert(e.message))}><Download size={16}/>{t.originalBackup}</button></div>}
       </div>}
     <div className="mobile-note">{t.savedLocally}</div>
   </main>
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
