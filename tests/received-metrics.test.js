import test from 'node:test';
import assert from 'node:assert/strict';
import { loadReceivedFromDrive, receivedFromCsv } from '../api/_receivedMetrics.js';

const csv = `"Início do intervalo";"Nome da fila";"Oferta"\n"07/10/26 00:00";"FL_SEBRAE_S_VIX_VOZ_REC_OUVIDORIA";"9"\n"07/10/26 00:00";"FL_SEBRAE_S_VIX_VOZ_REC_SAC";"297"\n`;

test('usa Oferta da linha que não é Ouvidoria', () => {
  assert.deepEqual(receivedFromCsv(csv, '07.10.2026.csv'), { date: '2026-10-07', received: 297 });
});

test('lista os CSVs da pasta e mantém a versão mais recente de cada dia', async () => {
  const calls = [];
  const request = async url => {
    calls.push(url);
    if (url.includes('/drive/v3/files?')) return { ok: true, json: async () => ({ files: [{ id: 'old', name: '07.10.2026.csv', modifiedTime: '2026-10-08T10:00:00Z' }, { id: 'new', name: '07.10.2026.csv', modifiedTime: '2026-10-08T11:00:00Z' }] }) };
    return { ok: true, text: async () => csv.replace('297', url.includes('/new?') ? '300' : '297') };
  };
  const result = await loadReceivedFromDrive('token', request);
  assert.equal(result.get('2026-10-07'), 300);
  assert.equal(calls.length, 3);
});
