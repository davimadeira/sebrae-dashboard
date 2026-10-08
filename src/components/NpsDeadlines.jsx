import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { deadlineSummary, statusSummary } from '../utils/npsDeadlines';
export function NpsStatusCard({ analysis }) {
  return <article className="ta-metric nps-status-card"><span>Situação dos registros</span><dl>{statusSummary(analysis).map((item, i) => <div key={i} className={item.count === null ? 'nps-status-pending' : ''}><dt><i aria-hidden="true" style={{ background: item.color }}/>{item.label}</dt><dd>{item.count === null ? '—' : item.count.toLocaleString('pt-BR')}</dd></div>)}</dl><small>Os dois últimos status serão definidos depois.</small></article>;
}
const groups = [ ['overdue', 'Prazo vencido', '#ef4444'], ['today', 'Vence hoje', '#f59e0b'], ['soon', 'Próximos 3 dias', '#3b82f6'], ['later', 'Mais de 3 dias', '#10b981'], ['missing', 'Sem prazo válido', '#94a3b8'] ];
export default function NpsDeadlines({ rows, onOpen }) {
  const summary = useMemo(() => deadlineSummary(rows), [rows]);
  const [selected, setSelected] = useState('overdue'), [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows, selected]);
  const list = summary[selected];
  return <section className="ta-card nps-deadlines"><header><h2><CalendarClock size={20}/>Acompanhamento de prazos</h2><p>Prazo Final dos registros classificados como abertos. Dias corridos, no calendário de São Paulo; o prazo de hoje ainda não é considerado vencido.</p></header><div className="nps-deadline-filters">{groups.map(([key, label, color]) => <button type="button" key={key} aria-pressed={selected === key} onClick={() => setSelected(key)} style={{'--deadline-color': color}}><span><i aria-hidden="true"/>{label}</span><strong>{summary[key].length.toLocaleString('pt-BR')}</strong></button>)}</div>
    {list.length ? <><div className="ticket-table-scroll"><table className="ticket-table"><thead><tr>{['Cliente / ID Genesys', 'Prazo Final', 'Situação do prazo', 'Responsável', 'Ação'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{list.slice((page - 1) * 10, page * 10).map(r => <tr key={r.row}><td><strong>{r.values[1] || 'Sem nome'}</strong><small>{r.values[6] || 'Sem ID'}</small></td><td>{r.deadline || 'Não informado'}</td><td><span className={`nps-due-label ${r.remaining < 0 ? 'is-late' : ''}`}>{r.remaining === null ? 'Preencher ou revisar prazo' : r.remaining < 0 ? `${Math.abs(r.remaining)} dia(s) de atraso` : r.remaining === 0 ? 'Vence hoje' : `Faltam ${r.remaining} dia(s)`}</span></td><td>{r.owner || 'Não atribuído'}</td><td><button className="ticket-open" onClick={() => onOpen(r)}>Abrir<ChevronRight size={14}/></button></td></tr>)}</tbody></table></div><div className="ticket-pagination"><span>{list.length} registros · prazo mais próximo primeiro</span><div><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>{page} / {Math.ceil(list.length / 10)}</span><button disabled={page * 10 >= list.length} onClick={() => setPage(p => p + 1)}>Próxima</button></div></div></> : <p className="ta-empty">Nenhum registro aberto nesta faixa de prazo.</p>}
    <p className="ta-note">Respeita os filtros acima. Status sem classificação e registros fora do grupo “Em aberto” não entram nesta contagem. Datas ausentes ou inválidas ficam em “Sem prazo válido”.</p>
  </section>;
}
