import test from 'node:test';
import assert from 'node:assert/strict';
import {npsFields} from '../api/_npsFields.js';
test('validações de data não viram lista vazia obrigatória',async()=>{const fields=await npsFields('https://example.test',{},['DATA DE CONTATO (CNR)','STATUS'],async()=>({ok:true,json:async()=>({sheets:[{data:[{rowData:[{values:[{dataValidation:{strict:true,condition:{type:'DATE_IS_VALID'}}},{dataValidation:{strict:true,condition:{type:'ONE_OF_LIST',values:[{userEnteredValue:'Pendente'}]}}}]}]}]}]})}),[],[]);assert.equal(fields[0].strict,false);assert.equal(fields[1].strict,true);assert.deepEqual(fields[1].options,['Pendente'])});
