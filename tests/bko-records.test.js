import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler as factory} from '../api/bko-records.js';
const columns=['Protocolo','Observações'];
const response=()=>({setHeader(){},status(code){this.code=code;return this},json(body){this.body=body}});
function setup(fail=false){const calls=[];return{calls,handler:factory(async()=>({uid:'bko'}),async()=>'',async(url,options={})=>{calls.push({url,options});return{ok:!(fail&&options.method==='POST'),json:async()=>url.includes('fields=')?{sheets:[{properties:{title:'Preenchimento',sheetId:0,gridProperties:{rowCount:60000}}}]}:{values:url.includes('FORMULA')?[]:[columns]}}},async()=>[])}}
test('bloqueia usuário sem BKO',async()=>{const res=response();await factory(async()=>{throw Object.assign(new Error('Restrito'),{statusCode:403})},()=>assert.fail())({method:'POST'},res);assert.equal(res.code,403)});
test('retorna cabeçalhos',async()=>{const{handler}=setup();const res=response();await handler({method:'GET'},res);assert.deepEqual(res.body.headers,columns)});
test('não grava esquema antigo',async()=>{const{handler,calls}=setup();const res=response();await handler({method:'POST',body:{columns:['Antiga'],values:['123']}},res);assert.equal(res.code,409);assert.equal(calls.length,1)});
test('valida protocolo e valores',async()=>{for(const values of [['','texto'],['123',{}],['123']]){const{handler,calls}=setup();const res=response();await handler({method:'POST',body:{columns,values}},res);assert.equal(res.code,400);assert.equal(calls.length,1)}});
test('insere no topo vazio preservando zeros e texto seguro',async()=>{const{handler,calls}=setup();const res=response();await handler({method:'POST',body:{columns,values:['00123','=1+1']}},res);assert.equal(res.code,201);const writes=calls.filter(c=>c.options.method==='POST');assert.equal(writes.length,1);const req=JSON.parse(writes[0].options.body).requests;assert.deepEqual(req.filter(r=>r.updateCells).map(r=>r.updateCells.rows[0].values[0].userEnteredValue.stringValue),['00123','=1+1']);assert.equal(req[0].insertDimension.range.startIndex,1)});
test('não confirma gravação falha',async()=>{const{handler}=setup(true);const res=response();await handler({method:'POST',body:{columns,values:['123','texto']}},res);assert.equal(res.code,503)});
