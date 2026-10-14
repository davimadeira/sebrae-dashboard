import test from 'node:test';
import assert from 'node:assert/strict';
import { inDateRange, normalizedDate, presetRange } from '../src/utils/dateRange.js';
import { tickets } from '../api/_bkoTickets.js';
test('intervalo inclusivo aceita datas brasileiras com hora e rejeita datas inexistentes',()=>{
 const range={start:'2026-09-30',end:'2026-10-02'};
 for(const date of ['30/09/2026 14:25:00','01/10/2026','2026-10-02'])assert.equal(inDateRange(date,range),true);
 for(const date of ['29/09/2026','03/10/2026','','31/09/2026'])assert.equal(inDateRange(date,range),false);
 assert.equal(normalizedDate('29/02/2024'),'2024-02-29');assert.equal(normalizedDate('29/02/2026'),'');
 assert.equal(inDateRange('',{}),true);
});
test('atalhos atravessam ano e mês sem deslocamento de fuso',()=>{
 const today=new Date(2026,0,1,23);
 assert.deepEqual(presetRange('Últimos 7 dias',today),{start:'2025-12-26',end:'2026-01-01'});
 assert.deepEqual(presetRange('Ontem',today),{start:'2025-12-31',end:'2025-12-31'});
 assert.deepEqual(presetRange('Mês passado',today),{start:'2025-12-01',end:'2025-12-31'});
 assert.deepEqual(presetRange('Semana passada',today),{start:'2025-12-21',end:'2025-12-27'});
 assert.deepEqual(presetRange('Este mês',new Date(2024,1,12)),{start:'2024-02-01',end:'2024-02-29'});
});
test('chamados filtra por abertura antes da paginação e combina status',async()=>{
 const rows=Array.from({length:65},(_,i)=>{const values=Array(17).fill('');values[0]=String(i+1);values[2]=i<40?'01/10/2026':'02/10/2026';values[12]='Pendente';return values;});
 const result={status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
 const context={base:'https://example.test/',headers:{},schema:Array(17).fill('Coluna'),request:async()=>({ok:true,json:async()=>({values:rows})})};
 await tickets({method:'GET',query:{mode:'tickets',start:'2026-10-01',end:'2026-10-01',status:'Pendente',page:'2'}},result,context);
 assert.equal(result.body.total,40);assert.equal(result.body.pages,2);assert.equal(result.body.records.length,10);assert.equal(result.body.records[0].row,11);
 await assert.rejects(()=>tickets({method:'GET',query:{mode:'tickets',start:'2026-10-03',end:'2026-10-01'}},result,context),/Período inválido/);
});
