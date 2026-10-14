import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/bko-records.js';
const schema = ['Protocolo','Observação','Status Ticket','Mês'];
const row = ['00123','Anterior','Pendente','outubro'];
const raw = ['00123','Anterior','Pendente','=TEXT(C2;"mmmm")'];
const res = () => ({setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}});
function setup() {
 const writes=[];
 const handler=createHandler(async()=>({uid:'bko'}),async()=> 'token',async(url,options)=> {
  if(options.method==='POST'){writes.push(JSON.parse(options.body));return {ok:true,json:async()=>({})};}
  return {ok:true,json:async()=>url.includes('fields=')? {sheets:[]}: {values:url.includes('1%3A1')?[schema]:url.includes('FORMULA')?[raw]:[row]}};
 }); return {handler,writes};
}
async function edit(setup, changes, version) {
 const detail=res(); await setup.handler({method:'GET',query:{mode:'ticket',row:'2'}},detail);
 const result=res(); await setup.handler({method:'PATCH',body:{row:2,columns:schema,version:version??detail.body.record.version,changes}},result);return result;
}
test('atualiza somente a célula modificada e preserva fórmulas',async()=>{const s=setup();const r=await edit(s,[{index:1,value:'Nova observação'}]);assert.equal(r.code,200);assert.deepEqual(s.writes,[{valueInputOption:'RAW',data:[{range:'Preenchimento!B2',values:[['Nova observação']]}]}]);});
test('bloqueia edição desatualizada sem escrever',async()=>{const s=setup();const r=await edit(s,[{index:1,value:'Alteração'}],'antiga');assert.equal(r.code,409);assert.equal(s.writes.length,0);});
test('protege protocolo, status e fórmula',async()=>{for(const index of [0,2,3]){const s=setup();const r=await edit(s,[{index,value:'Alteração'}]);assert.equal(r.code,400);assert.equal(s.writes.length,0);}});
test('nega edição para perfil não BKO',async()=>{const handler=createHandler(async()=>{throw Object.assign(new Error('Restrito'),{statusCode:403})},()=>assert.fail());const r=res();await handler({method:'PATCH'},r);assert.equal(r.code,403)});
test('lista retorna linha real e permite buscar protocolo',async()=>{const s=setup();const r=res();await s.handler({method:'GET',query:{mode:'tickets',q:'00123'}},r);assert.equal(r.code,200);assert.equal(r.body.records[0].row,2);assert.equal(r.body.total,1)});
