import DateRangePicker from './DateRangePicker';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react';
import { callbackDateLabels, filterCallbackDateRange, summarizeCallbackRows } from '../utils/callbackView';

const number = value => typeof value === 'number' ? value.toLocaleString('pt-BR') : '—';
const percent = value => typeof value === 'number' ? (value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—';
const emptyFilters = () => ({ start: '', end: '' });
const columns = [
  ['Recebidas', 'received', 'Oferta da fila SAC nos arquivos diários, sem Ouvidoria', 'volume'],
  ['Atendidas únicas', 'unique', 'Atendidas Únicas = ID do atendimento', 'volume'],
  ['Finalizadas', 'finished', 'Finalizadas = Atendidas Únicas - Elegíveis para callback', 'volume'],
  ['Elegíveis para callback', 'eligible', 'Entradas elegíveis para callback, sem repetir o ID', 'return'],
  ['Callback realizado', 'performed', 'Combinações únicas de SIP na coluna ANI e telefone na coluna DNIS, no dia da interação de saída', 'return'],
  ['% realizado', 'performedRate', 'Realizados ÷ elegíveis', 'return'],
  ['Callback com sucesso', 'success', 'Combinação de SIP e DNIS com Total de conversas maior que zero', 'return'],
  ['% com sucesso', 'successRate', 'Sucesso ÷ realizados', 'return'],
  ['Callback sem sucesso', 'failed', 'Combinação de SIP e DNIS sem Total de conversas maior que zero', 'return'],
  ['% sem sucesso', 'failedRate', 'Sem sucesso ÷ realizados', 'return'],
  ['Callback não realizado', 'pending', 'Elegíveis menos callbacks realizados', 'return'],
  ['Potencial de registros', 'potential', 'Potencial de Registro = Finalizadas + Callback com sucesso', 'focus'],
  ['Registro no Foco', 'registered', 'Registros de telefonia na aba Foco, pela data de abertura', 'focus'],
  ['% registro no Foco', 'registeredRate', 'Registros no Foco ÷ potencial de registros', 'focus'],
];
const valueOf = (row, key) => key.endsWith('Rate') ? percent(row[key]) : number(row[key]);
const infoColumns = new Set(['unique', 'finished', 'eligible', 'potential']);
const ColumnLabel = ({ label, metricKey, note }) => <span className="callback-column-label"><span>{label}</span>{infoColumns.has(metricKey) && <span className="callback-info" tabIndex={0} aria-label={note}><Info size={12}/><span role="tooltip">{note}</span></span>}</span>;
const formulas = [
  ['Recebidas', 'Oferta da fila SAC, sem Ouvidoria.'],
  ['Atendidas únicas', 'IDs únicos de voz com direção Entrada.'],
  ['Finalizadas', 'Atendidas únicas − Elegíveis.'],
  ['Elegíveis para callback', 'Entradas elegíveis para callback, sem repetir o ID.'],
  ['Callback realizado', 'Combinações únicas de SIP + DNIS no dia.'],
  ['% realizado', 'Callback realizado ÷ Elegíveis.'],
  ['Callback com sucesso', 'Realizados com Total de conversas maior que zero.'],
  ['% com sucesso', 'Callback com sucesso ÷ Callback realizado.'],
  ['Callback sem sucesso', 'Realizados com Total de conversas zero ou vazio.'],
  ['% sem sucesso', 'Callback sem sucesso ÷ Callback realizado.'],
  ['Callback não realizado', 'Elegíveis − Callback realizado, com mínimo zero.'],
  ['Potencial de registros', 'Finalizadas + Callback com sucesso.'],
  ['Registro no Foco', 'Linhas de Telefonia registradas na aba Foco.'],
  ['% registro no Foco', 'Registro no Foco ÷ Potencial de registros.'],
];

export default function CallbackPanel({ user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [filters, setFilters] = useState(emptyFilters);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    (async () => {
      const response = await fetch('/api/callback', {
        cache: 'no-store', signal: controller.signal,
        headers: { Authorization: 'Bearer ' + await user.getIdToken() },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os dados de Callback.');
      if (!Array.isArray(result.rows)) throw new Error('A atualização está sendo publicada. Aguarde e atualize a página.');
      if (active) setData(result);
    })().catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [user, reload]);

  const rows = useMemo(() => filterCallbackDateRange(data?.rows || [], filters), [data, filters]);
  const total = useMemo(() => summarizeCallbackRows(rows), [rows]);

  return <section className="callback-page callback-compact">
    <header className="callback-panel-heading">
      <div className="callback-heading-copy"><h1>Callback</h1>
        <p><span className={'callback-connection-dot' + (data ? ' is-connected' : '')}/>{data ? rows.length + ' dias no período' : 'Indicadores de atendimento'}{data && <span> · Atualizado às {new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}</p>
      </div>
      <div className="callback-heading-actions">
        <DateRangePicker value={filters} onChange={setFilters} label="Data"/>
        <button type="button" className="callback-refresh" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>Atualizar</button>
      </div>
    </header>
    {error && <div role="alert" className="ticket-error">{error}</div>}
    {loading ? <div className="ticket-empty" role="status"><Loader2 className="animate-spin" size={24}/><p>Carregando indicadores de Callback…</p></div> : data && <>
      <section className="callback-table-card" aria-label="Indicadores diários de callback">
        <div className="callback-table-scroll" role="region" aria-label="Tabela de Callback por data" tabIndex={0}>
          <table className="callback-main-table">
            <caption className="sr-only">Indicadores de Callback por dia. Totais e percentuais recalculados para os filtros selecionados.</caption>
            <colgroup><col className="callback-date-col"/>{columns.map(([, key]) => <col key={key}/>)}</colgroup>
            <thead><tr><th scope="col" className="callback-date-cell">Data</th>{columns.map(([label, key, note, group]) => <th key={key} scope="col" className={'cb-' + group} title={infoColumns.has(key) ? undefined : note}><ColumnLabel label={label} metricKey={key} note={note}/></th>)}</tr></thead>
            <tbody>{rows.length ? rows.map(row => <tr key={row.date}>
              <th scope="row" className="callback-date-cell">{callbackDateLabels(row.date).dias}</th>
              {columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group + (key.endsWith('Rate') ? ' callback-rate' : '')} title={row[key] === null ? note : undefined}>{valueOf(row, key)}</td>)}
            </tr>) : <tr><td colSpan={columns.length + 1} className="callback-no-results">Nenhum registro para os filtros selecionados.</td></tr>}</tbody>
            {rows.length > 0 && <tfoot><tr><th scope="row" className="callback-date-cell">Total</th>{columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group} title={total[key] === null ? note : undefined}>{valueOf(total, key)}</td>)}</tr></tfoot>}
          </table>
        </div>
        <div className="callback-table-legend"><span><i className="callback-dot received"/>Recebimento</span><span><i className="callback-dot callback"/>Callback</span><span><i className="callback-dot focus"/>Foco</span><p>{number(total.mixed)} interações Entrada/Saída separadas.</p></div>
      </section>
      <div className="callback-summary-cards" aria-label="Resumo do período filtrado">
        <div><span>Elegíveis</span><strong>{loading || !data ? '—' : number(total.eligible)}</strong></div>
        <div><span>Realizados</span><strong>{loading || !data ? '—' : number(total.performed)}</strong></div>
        <div><span>Com sucesso</span><strong>{loading || !data ? '—' : percent(total.successRate)}</strong></div>
      </div>
      <div className="callback-notice"><AlertCircle size={15}/><p><strong>—</strong> indica definição ou fonte pendente. Sucesso significa conversa com o cliente, não comprova atendimento concluído. <a href="https://docs.google.com/spreadsheets/d/1Egx88GkeZ9ZHQrijClJEXIEDlQBy-ImuW_G92uR65R4/edit" target="_blank" rel="noreferrer" className="underline">Abrir planilha</a></p></div>
    </>}
    <details className="bko-panel callback-section callback-formulas"><summary><Info size={15}/>Ver fórmula de cada coluna</summary><dl>
      {formulas.map(([label, formula]) => <div key={label}><dt>{label}</dt><dd>{formula}</dd></div>)}
    </dl></details>
  </section>;
}
