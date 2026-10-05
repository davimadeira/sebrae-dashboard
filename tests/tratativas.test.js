import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/tratativas.js';
const response=()=>({setHeader(){},status(code){this.code=code;return this},json(body){this.body=body}});
test('restringe consulta ao BKO antes de acessar planilha',async()=>{const res=response();await createHandler(async()=>{throw Object.assign(new Error('Restrito'),{statusCode:403})},()=>assert.fail())({method:'GET'},res);assert.equal(res.code,403)});
test('preserva cabeçalhos repetidos e remove linhas vazias',async()=>{const res=response();await createHandler(async()=>{},async()=>'',async()=>({ok:true,json:async()=>({values:[['OPERADOR','OPERADOR'],['A','B'],[],['C']]})}))({method:'GET'},res);assert.deepEqual(res.body.headers,['OPERADOR','OPERADOR']);assert.equal(res.body.records.length,2);assert.deepEqual(res.body.records[1],{row:4,values:['C','']})});
test('aceita aba apenas com cabeçalhos',async()=>{const res=response();await createHandler(async()=>{},async()=>'',async()=>({ok:true,json:async()=>({values:[['STATUS']]})}))({method:'GET'},res);assert.equal(res.code,200);assert.deepEqual(res.body.records,[])});
