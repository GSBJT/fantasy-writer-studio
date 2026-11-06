import test from 'node:test';
import assert from 'node:assert/strict';
import {freshLibrary,activeBook,patchBook,upgradeBackup,validLibrary,migrateLegacy} from '../src/model.js';
test('v1 additive map / timeline / relationship / prompt data survives JSON backup round-trip',()=>{
 let lib=freshLibrary();const id=lib.activeBookId;
 lib=patchBook(lib,id,b=>({...b,maps:[{id:'m',title:'Карта',background:'data:image/png;base64,AAAA',markers:[{id:'p',x:33,y:20,name:'City',worldId:'w'}],paths:[]}],worlds:[{id:'w',name:'World',parentId:null,images:[{id:'img',data:'data:image/png;base64,AAAA'}]}],relations:[{id:'r',from:'w',to:'w2',type:'ally'}],events:[{id:'e',order:'Era 1',title:'Start',chapterId:''}],prompts:[{id:'a',prompt:'Test'}]}));
 const copy=upgradeBackup(JSON.parse(JSON.stringify(lib)));assert.ok(validLibrary(copy));assert.deepEqual(activeBook(copy).maps,activeBook(lib).maps);assert.deepEqual(activeBook(copy).events,activeBook(lib).events);assert.deepEqual(activeBook(copy).relations,activeBook(lib).relations);assert.deepEqual(activeBook(copy).prompts,activeBook(lib).prompts);assert.equal(copy.books[0].worlds[0].images[0].data,'data:image/png;base64,AAAA');
});
test('v0.1 migration keeps original unknown metadata without mutating the source',()=>{
 const old={schemaVersion:1,title:'Книга',chapters:[],characters:[],worlds:[],customField:{legacy:'untouched'}};
 const migrated=migrateLegacy(old);assert.deepEqual(migrated.books[0].customField,old.customField);assert.equal(old.schemaVersion,1);
});
