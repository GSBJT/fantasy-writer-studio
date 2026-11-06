import { openDB } from 'idb';
const dbPromise = openDB('fantasy-writer-studio-v1', 1, {
  upgrade(db) { db.createObjectStore('project'); }
});
export async function loadProject() { return (await dbPromise).get('project', 'current'); }
export async function saveProject(project) { return (await dbPromise).put('project', project, 'current'); }
export function newProject() { return {
  schemaVersion: 1, title: 'Моят фентъзи роман', author: '',
  chapters: [{ id: crypto.randomUUID(), title: 'Глава 1', text: '' }],
  characters: [], worlds: [], updatedAt: new Date().toISOString()
}; }
export function downloadBlob(blob, filename) {
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=filename; document.body.appendChild(a); a.click();
  a.remove(); setTimeout(()=>URL.revokeObjectURL(url),3000);
}
export function safeFilename(s) { return (s || 'fantasy-writer').replace(/[\\/:*?"<>|]/g,'_').slice(0,65); }
