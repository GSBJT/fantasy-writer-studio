import {openDB} from 'idb';
import {freshLibrary,migrateLegacy,validLegacy,validLibrary} from './model';
// Keep exactly the v0.1 database and object store. Never remove the legacy key.
const dbPromise=openDB('fantasy-writer-studio-v1',1,{upgrade(db){if(!db.objectStoreNames.contains('project'))db.createObjectStore('project');}});
const STORE='project';
export async function loadLibrary(){
  const db=await dbPromise;
  const updated=await db.get(STORE,'library-v2');
  if(updated!==undefined){if(!validLibrary(updated))throw new Error('Stored v0.2 library is invalid; original data left untouched');return updated;}
  const old=await db.get(STORE,'current');
  if(old!==undefined){
    if(!validLegacy(old))throw new Error('Old data is invalid; no migration attempted');
    const next=migrateLegacy(old);
    // Atomic migration: a backup of v0.1 and the new library in one transaction.
    const tx=db.transaction(STORE,'readwrite');
    await tx.store.put(old,'legacy-v01-snapshot');
    await tx.store.put(next,'library-v2');
    await tx.done;
    return next;
  }
  const next=freshLibrary();await db.put(STORE,next,'library-v2');return next;
}
let writeQueue=Promise.resolve();
export function saveLibrary(lib){
  if(!validLibrary(lib))return Promise.reject(Error('Invalid library state'));
  const snapshot=structuredClone({...lib,updatedAt:new Date().toISOString()});
  const job=writeQueue.catch(()=>{}).then(async()=>{const db=await dbPromise;await db.put(STORE,snapshot,'library-v2');});
  writeQueue=job;return job;
}
export async function getLegacySnapshot(){return (await dbPromise).get(STORE,'legacy-v01-snapshot');}
export async function exportLegacySnapshot(){const old=await getLegacySnapshot();if(!old)throw Error('No v0.1 snapshot found');downloadBlob(new Blob([JSON.stringify(old,null,2)],{type:'application/json'}),'fantasy-writer-v0.1-original.json');}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
export function safeFilename(s){return(s||'fantasy-writer').replace(/[\\/:*?"<>|]/g,'_').slice(0,65);}
