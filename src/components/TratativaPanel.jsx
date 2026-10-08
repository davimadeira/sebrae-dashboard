import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, ClipboardList, Plus } from 'lucide-react';
import TratativaAnalytics from './TratativaAnalytics';
import NpsRecordForm from './NpsRecordForm';
import { analyticsIndexes } from '../utils/npsSchema';
export const TRATATIVA_TITLE = 'NPS';
export default function TratativaPanel({ user }) {
  const [view, setView] = useState('overview');
  const [data, setData] = useState({ headers: [], records: [], fields: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [editor, setEditor] = useState(null), [reload, setReload] = useState(0), [refreshPending, setRefreshPending] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    (async () => {
      const response = await fetch('/api/tratativas', { headers: { Authorization: `Bearer ${await user.getIdToken(true)}` } });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Não foi possível carregar o NPS.');
      if (active) { setData(result); setPage(1); }
    })().catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, reload]);
  const indexes = useMemo(() => analyticsIndexes(data.headers), [data.headers]);
  const records = useMemo(() => data.records.map(record => ({ ...record, source: record, values: indexes.map(i => i >= 0 ? record.values[i] : '') })), [data.records, indexes]);
  const filtered = useMemo(() => records.filter(({ values, source }) => (!status || values[9] === status) && (!query || source.values.some(value => value.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))))), [records, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const closeEditor = () => { setEditor(null); setView('records'); if (refreshPending) { setReload(n => n + 1); setRefreshPending(false); } };
  return <section className="ticket-workspace">
    {editor && <NpsRecordForm key={editor.record?.row || 'new'} user={user} data={data} record={editor.record} onClose={closeEditor} onSaved={() => setRefreshPending(true)}/>}
    <div hidden={!!editor}>
    <div className="ticket-heading"><div><p className="bko-eyebrow">ACOMPANHAMENTO DE RETORNOS</p><h1>NPS</h1><p>Prioridades, contatos e resultados conectados à planilha NPS.</p></div><div className="flex flex-wrap gap-3"><button className="bko-secondary" disabled={loading} onClick={() => setReload(n => n + 1)}><RefreshCw size={16}/>Atualizar</button><button className="bko-primary" disabled={loading || !!error || !data.headers.length} onClick={() => setEditor({ record: null })}><Plus size={17}/>Novo registro</button></div></div>
    {error && <div role="alert" className="ticket-error">{error}</div>}
    <nav className="ta-view-tabs" aria-label="Visão do NPS"><button aria-current={view === 'overview' ? 'page' : undefined} onClick={() => setView('overview')}>Visão geral</button><button aria-current={view === 'records' ? 'page' : undefined} onClick={() => setView('records')}>Todos os registros</button></nav>
    {loading && <div className="ticket-empty" role="status">Carregando NPS…</div>}
    <div hidden={view !== 'overview' || loading || !!error}><TratativaAnalytics records={records} onOpen={record => setEditor({ record: record.source })}/></div>
    <div hidden={view !== 'records' || loading || !!error} className="ticket-list-panel"><div className="ticket-toolbar"><Search size={18}/><input className="bko-input" aria-label="Buscar registros NPS" placeholder="Buscar cliente, ID ou informação do atendimento" value={query} onChange={e => {setQuery(e.target.value);setPage(1);}}/><select aria-label="Status do NPS" className="bko-input" style={{maxWidth:220}} value={status} onChange={e => {setStatus(e.target.value);setPage(1);}}><option value="">Todos os status</option>{[...new Set(records.map(r => r.values[9]).filter(Boolean))].sort().map(value => <option key={value}>{value}</option>)}</select></div>
    {!filtered.length ? <div className="ticket-empty"><ClipboardList size={32}/><h2>{records.length ? 'Nenhum registro encontrado' : 'O NPS ainda não possui registros'}</h2><p>{records.length ? 'Altere a busca ou o filtro.' : 'Clique em Novo registro para iniciar o primeiro atendimento.'}</p></div> : <div className="ticket-table-scroll"><table className="ticket-table"><thead><tr>{['Início','Cliente','Perfil','ID Genesys','Status','Conclusão','Ações'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{filtered.slice((page - 1) * 25, page * 25).map(record => <tr key={record.row}>{[0,1,5,6,9,28].map(i => <td key={i}>{record.values[i] || '—'}</td>)}<td><button className="ticket-open" onClick={() => setEditor({ record: record.source })}>Abrir e editar</button></td></tr>)}</tbody></table></div>}
    <div className="ticket-pagination"><span>{filtered.length.toLocaleString('pt-BR')} registros</span><div><button disabled={page <= 1} onClick={() => setPage(n => n - 1)}>Anterior</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage(n => n + 1)}>Próxima</button></div></div></div>
    <p className="ticket-footnote">Cadastro e edição disponíveis ao perfil BKO. Novos registros são inseridos após a última linha preenchida.</p>
    </div>
  </section>;
}
