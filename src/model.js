// Pure data model, independent of browser storage; tested with node:test.
export const SCHEMA_VERSION = 2;
export const uid = () => globalThis.crypto.randomUUID();
export function freshBook(id = uid(), title = 'Нов роман') {
  return { id, title, author:'', seriesId:null, volume:'', coverImage:null,
    chapters:[{id:uid(),title:'Глава 1',text:''}],characters:[],worlds:[],updatedAt:new Date().toISOString() };
}
export function freshLibrary() {
  const book=freshBook(undefined,'Моят фентъзи роман');
  return {schemaVersion:2, books:[book], series:[], activeBookId:book.id, updatedAt:new Date().toISOString()};
}
function isObj(v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}
function bookValid(b){return isObj(b)&&typeof b.id==='string'&&typeof b.title==='string'&&Array.isArray(b.chapters)&&Array.isArray(b.characters)&&Array.isArray(b.worlds)&&b.chapters.every(c=>isObj(c)&&typeof c.id==='string'&&typeof c.text==='string'&&typeof c.title==='string');}
export function validLibrary(v){return isObj(v)&&v.schemaVersion===2&&Array.isArray(v.books)&&v.books.length>0&&v.books.every(bookValid)&&Array.isArray(v.series)&&typeof v.activeBookId==='string'&&v.books.some(b=>b.id===v.activeBookId)&&new Set(v.books.map(b=>b.id)).size===v.books.length;}
export function validLegacy(v){return isObj(v)&&v.schemaVersion===1&&typeof v.title==='string'&&Array.isArray(v.chapters)&&Array.isArray(v.characters)&&Array.isArray(v.worlds);}
export function migrateLegacy(legacy){
  if(!validLegacy(legacy))throw new Error('Invalid v0.1 data');
  const book={...structuredClone(legacy),id:uid(),seriesId:null,volume:'',coverImage:null};
  // Preserve all v0.1 chapters, pictures (base64), details and unknown properties.
  delete book.schemaVersion;
  return {schemaVersion:2,books:[book],series:[],activeBookId:book.id,updatedAt:new Date().toISOString(),migratedFrom:'v0.1'};
}
export function upgradeBackup(value){if(validLibrary(value))return structuredClone(value);if(validLegacy(value))return migrateLegacy(value);throw new Error('Unrecognized backup schema');}
export function activeBook(lib){return lib.books.find(b=>b.id===lib.activeBookId)||lib.books[0];}
export function selectBook(lib,id){return lib.books.some(b=>b.id===id)?{...lib,activeBookId:id}:lib;}
export function patchBook(lib,id,fn){return {...lib,books:lib.books.map(b=>b.id===id?{...fn(b),updatedAt:new Date().toISOString()}:b)};}
export function removeBook(lib,id){if(lib.books.length<=1)throw new Error('Keep at least one book'); const books=lib.books.filter(b=>b.id!==id);return {...lib,books,activeBookId:lib.activeBookId===id?books[0].id:lib.activeBookId};}
