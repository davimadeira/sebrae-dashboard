import { useEffect, useRef, useState } from 'react';
import { Plus, Search, ArrowUpRight, Loader2, RefreshCw, Ticket } from 'lucide-react';
import BkoRecordModal from './BkoRecordModal';

export default function BkoTickets({ user, onSaved }) {
  const [view, setView] = useState('list'), [record, setRecord] = useState(null);
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [status, setStatus] = useState('');
  const [page, setPage] = useState(1), [reload, setReload] = useState(0);
  const [result, setResult] = useState({ records: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true), [opening, setOpening] = useState(false), [error, setError] = useState('');
  const requestId = useRef(0);
  const get = async params => {
    const token = await user.getIdToken(true);
    const response = await fetch(`/api/bko-records?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os chamados.');
    return data;
  };
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    get({ mode: 'tickets', q: search, status, page }).then(data => { if (active) setResult(data); }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, search, status, page, reload]);
  const open = async row => {
    const id = ++requestId.current; setOpening(true); setError('');
    try { const data = await get({ mode: 'ticket', row }); if (id === requestId.current) { setRecord(data.record); setView('edit'); } }
    catch (err) { setError(err.message); } finally { setOpening(false); }
  };
  const back = () => { setView('list'); setRecord(null); setReload(n => n + 1); };
  if (view !== 'list') return <BkoRecordModal key={record?.row || 'new'} user={user} record={record} onClose={back} onSaved={onSaved} />;
  return <section className="ticket-workspace">
    <div className="ticket-heading"><div><p className="bko-eyebrow">CENTRAL DE ATENDIMENTO</p><h1>Chamados</h1><p>Consulte, registre e atualize os atendimentos da operação.</p></div><button className="bko-primary" disabled={opening} onClick={() => { setRecord(null); setView('new'); }}><Plus size={18} />Novo chamado</button></div>
    <div className="ticket-list-panel">
      <div className="ticket-tabs" aria-label="Filtrar por status">{[['', 'Todos os chamados'], ['Pendente', 'Pendentes'], ['Concluído', 'Concluídos']].map(([value, label]) => <button key={value} aria-pressed={status === value} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>)}</div>
      <div className="ticket-toolbar"><form onSubmit={event => { event.preventDefault(); setSearch(query.trim()); setPage(1); }}><Search size={18} /><input aria-label="Buscar chamados" placeholder="Buscar protocolo, assunto ou responsável" value={query} onChange={event => setQuery(event.target.value)} /><button type="submit">Buscar</button></form><button className="ticket-refresh" onClick={() => setReload(n => n + 1)} disabled={loading} aria-label="Atualizar chamados"><RefreshCw size={17} /></button></div>
      {error && <div className="ticket-error" role="alert">{error}<button onClick={() => setReload(n => n + 1)}>Tentar novamente</button></div>}
      {loading ? <div className="ticket-empty" role="status"><Loader2 className="animate-spin" />Carregando chamados…</div> : !result.records.length ? <div className="ticket-empty"><Ticket size={32} /><h2>Nenhum chamado encontrado</h2><p>Experimente outro termo ou altere o filtro de status.</p></div> : <div className="ticket-table-scroll"><table className="ticket-table"><thead><tr><th>Protocolo / abertura</th><th>Assunto</th><th>Origem</th><th>Responsável</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{result.records.map(({ row, values }) => <tr key={row}><td><strong>{values[0]}</strong><small>{values[2] || 'Sem data'}</small></td><td><span className="ticket-subject">{values[7] || 'Sem assunto'}</span></td><td>{values[4] || '—'}</td><td>{values[16] || values[5] || '—'}</td><td><span className={`ticket-status ${values[12] === 'Concluído' ? 'is-done' : 'is-pending'}`}>{values[12] || 'Sem status'}</span></td><td><button disabled={opening} onClick={() => open(row)} aria-label={`Editar chamado ${values[0]}`} className="ticket-open">Editar<ArrowUpRight size={15} /></button></td></tr>)}</tbody></table></div>}
      <div className="ticket-pagination"><span>{result.total.toLocaleString('pt-BR')} chamados{opening && ' · Abrindo chamado…'}</span><div><button disabled={loading || page <= 1} onClick={() => setPage(n => n - 1)}>Anterior</button><span>{page} / {result.pages}</span><button disabled={loading || page >= result.pages} onClick={() => setPage(n => n + 1)}>Próxima</button></div></div>
    </div><p className="ticket-footnote">As alterações são salvas na planilha BKO. Todos os usuários com perfil BKO podem atualizar os chamados.</p>
  </section>;
}
