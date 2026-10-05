import { useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, ClipboardList } from 'lucide-react';
import TratativaAnalytics from './TratativaAnalytics';
// Título da navegação separado do nome da aba de origem.
export const TRATATIVA_TITLE = 'Tratativa';
const groups = [
  ['Cliente e identificação', [0,1,2,3,4,5,6]],
  ['Análise e resposta', [7,8,9,10,11,12,13]],
  ['1º contato', [14,15,16]], ['2º contato', [17,18,19]],
  ['3º contato', [20,21,22]], ['4º contato', [23,24,25]],
  ['Conclusão e encaminhamento', [26,27,28,29]],
];
export default function TratativaPanel({ user }) {
  const [view, setView] = useState('overview');
  const [data, setData] = useState({ headers: [], records: [] });
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1), [selected, setSelected] = useState(null), [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    (async () => {
      const token = await user.getIdToken(true);
      const response = await fetch('/api/tratativas', { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar as tratativas.');
      if (active) { setData(result); setSelected(null); setPage(1); }
    })().catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, reload]);
  const filtered = useMemo(() => data.records.filter(({ values }) => (!status || values[9] === status) && (!query || values.some(value => value.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))))), [data, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  return <section className="ticket-workspace">
    <div className="ticket-heading"><div><p className="bko-eyebrow">ACOMPANHAMENTO DE RETORNOS</p><h1>{TRATATIVA_TITLE}</h1><p>Prioridades, contatos e resultados · dados da aba Tratativa.</p></div><button className="bko-secondary" disabled={loading} onClick={() => setReload(n => n + 1)}><RefreshCw size={16}/>Atualizar</button></div>
    {error && <div role="alert" className="ticket-error">{error}</div>}
    {!selected && <nav className="ta-view-tabs" aria-label="Visão das tratativas"><button aria-current={view === 'overview' ? 'page' : undefined} onClick={() => setView('overview')}>Visão geral</button><button aria-current={view === 'records' ? 'page' : undefined} onClick={() => setView('records')}>Todos os registros</button></nav>}
    {loading && view === 'overview' && <div className="ticket-empty" role="status">Carregando indicadores…</div>}
    <div hidden={!!selected || view !== 'overview' || loading || !!error}><TratativaAnalytics records={data.records} onOpen={setSelected} /></div>
    <div hidden={!selected && view !== 'records'}>
    {selected ? <><button className="bko-secondary mb-5" onClick={() => setSelected(null)}>← Voltar à lista</button><h2 className="mb-5 text-xl font-bold">{selected.values[1] || 'Detalhes da tratativa'}</h2><div className="grid gap-5 lg:grid-cols-2">{[...groups, ...(data.headers.length > 30 ? [['Outras informações', data.headers.slice(30).map((_,i)=>i+30)]] : [])].map(([title,indexes])=><section className="bko-panel p-5" key={title}><h3 className="mb-4 font-bold">{title}</h3><dl className="space-y-4">{indexes.filter(i=>data.headers[i]).map(i=><div key={i}><dt className="text-xs text-slate-500">{data.headers[i]}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{selected.values[i] || 'Não informado'}</dd></div>)}</dl></section>)}</div></> : <div className="ticket-list-panel"><div className="ticket-toolbar"><Search size={18}/><input className="bko-input" aria-label="Buscar tratativas" placeholder="Buscar cliente, ID ou informação da tratativa" value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}}/><select aria-label="Status da tratativa" className="bko-input" style={{maxWidth:220}} value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">Todos os status</option>{[...new Set(data.records.map(r=>r.values[9]).filter(Boolean))].sort().map(value=><option key={value}>{value}</option>)}</select></div>
    {loading ? <div className="ticket-empty" role="status">Carregando tratativas…</div> : !filtered.length ? <div className="ticket-empty"><ClipboardList size={32}/><h2>{data.records.length ? 'Nenhuma tratativa encontrada' : 'A aba Tratativa ainda não possui registros'}</h2><p>{data.records.length ? 'Altere a busca ou o filtro.' : `${data.headers.length} colunas identificadas. Os registros preenchidos na planilha aparecerão aqui ao atualizar.`}</p></div> : <div className="ticket-table-scroll"><table className="ticket-table"><thead><tr>{['Início','Cliente','Perfil','ID Genesys','Status','Conclusão','Detalhes'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{filtered.slice((page-1)*25,page*25).map(record=><tr key={record.row}>{[0,1,5,6,9,28].map(i=><td key={i}>{record.values[i] || '—'}</td>)}<td><button className="ticket-open" onClick={()=>setSelected(record)}>Ver detalhes</button></td></tr>)}</tbody></table></div>}
    <div className="ticket-pagination"><span>{filtered.length.toLocaleString('pt-BR')} tratativas</span><div><button disabled={page<=1} onClick={()=>setPage(n=>n-1)}>Anterior</button><span>{page} / {pages}</span><button disabled={page>=pages} onClick={()=>setPage(n=>n+1)}>Próxima</button></div></div></div>}
    </div>
    <p className="ticket-footnote">Consulta conectada à planilha. O cadastro e a alteração das tratativas continuam na aba Tratativa da planilha.</p>
  </section>;
}
