import test from 'node:test';
import assert from 'node:assert/strict';
import {deadlineSummary,statusSummary} from '../src/utils/npsDeadlines.js';
import {analyze,day} from '../src/utils/tratativaAnalytics.js';
const row=(id,status,deadline)=>({row:id,deadline,values:Array.from({length:30},(_,i)=>i===9?status:'')});
test('prazos separam ontem, hoje, próximos três dias, futuro e inválidos',()=>{const rows=[row(2,'Em aberto','07/10/2026'),row(3,'Em aberto','08/10/2026'),row(4,'Em aberto','11/10/2026'),row(5,'Em aberto','12/10/2026'),row(6,'Em aberto','31/02/2026'),row(7,'Respondido','01/10/2026'),row(8,'Concluído','01/10/2026'),row(9,'Desconhecido','01/10/2026')];const summary=deadlineSummary(analyze(rows).rows,day('08/10/2026'));assert.deepEqual(Object.values(summary).map(r=>r.length),[1,1,1,1,1]);assert.equal(summary.overdue[0].remaining,-1);assert.equal(summary.today[0].remaining,0)});
test('sem prazo não vira vencido e os mais antigos vêm primeiro',()=>{const rows=analyze([row(2,'Pendente','07/10/2026'),row(3,'Em aberto',''),row(4,'Em aberto','02/10/2026')]).rows;const summary=deadlineSummary(rows,day('08/10/2026'));assert.deepEqual(summary.overdue.map(r=>r.row),[4,2]);assert.equal(summary.missing.length,1)});
test('status mostram contagens reais e reservam dois nomes sem inventar números',()=>{const summary=statusSummary(analyze([row(2,'Em aberto',''),row(3,'RESPONDIDO',''),row(4,'Respondida',''),row(5,'Não respondido','')]));assert.deepEqual(summary.map(r=>r.count),[1,2,null,null])});
