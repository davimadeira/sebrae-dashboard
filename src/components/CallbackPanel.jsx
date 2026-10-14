import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, CalendarDays, Loader2, RefreshCw } from 'lucide-react';
import { callbackDateLabels, filterCallbackDateRange, summarizeCallbackRows } from '../utils/callbackView';

const number = value => typeof value === 'number' ? value.toLocaleString('pt-BR') : '—';
const percent = value => typeof value === 'number' ? (value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—';
const emptyFilters = () => ({ start: '', end: '' });
const columns = [
  ['Recebidas', 'received', 'Voz de entrada; mistos separados', 'volume'],
  ['Atendidas', 'answered', 'Aguarda contagem por atendimento/segmento', 'volume'],
  ['Atendidas únicas', 'unique', 'IDs de entrada com operador e conversa positiva', 'volume'],
  ['Finalizadas', 'finished', 'Aguarda classificação de tabulações conclusivas', 'volume'],
  ['Elegíveis para callback', 'eligible', 'IDs originais da aba Callbacks', 'return'],
  ['Callback realizado', 'performed', 'Ao menos uma saída vinculada por origem', 'return'],
  ['Callback com sucesso', 'success', 'Cliente atendeu ao retorno', 'return'],
  ['Callback sem sucesso', 'failed', 'Tentativas sem conversa', 'return'],
  ['Callback não realizado', 'pending', 'Sem saída identificada na base', 'return'],
  ['% realizado', 'performedRate', 'Realizados ÷ elegíveis', 'return'],
  ['% com sucesso', 'successRate', 'Sucesso ÷ realizados', 'return'],
  ['% sem sucesso', 'failedRate', 'Sem sucesso ÷ realizados', 'return'],
  ['Potencial de registros', 'potential', 'Composição em validação', 'focus'],
  ['Registro no Foco', 'registered', 'Fonte separada pendente', 'focus'],
  ['% registro no Foco', 'registeredRate', 'Aguarda potencial e fonte do mesmo período', 'focus'],
];
const valueOf = (row, key) => key.endsWith('Rate') ? percent(row[key]) : number(row[key]);

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

  const invalidRange = Boolean(filters.start && filters.end && filters.start > filters.end);
  const rows = useMemo(() => filterCallbackDateRange(data?.rows || [], filters), [data, filters]);
  const total = useMemo(() => summarizeCallbackRows(rows), [rows]);

  return <section className="callback-page callback-compact">
    <header className="callback-hero">
      <div><p className="bko-eyebrow">ACOMPANHAMENTO DIÁRIO</p><h1>Callback</h1><p>Chamadas e retornos por data da ligação original.</p></div>
      <div className="callback-mini-stats" aria-label="Resumo do período filtrado">
        <div><span>Elegíveis</span><strong>{loading || !data ? '—' : number(total.eligible)}</strong></div>
        <div><span>Realizados</span><strong>{loading || !data ? '—' : number(total.performed)}</strong></div>
        <div><span>Com sucesso</span><strong>{loading || !data ? '—' : percent(total.successRate)}</strong></div>
      </div>
    </header>
    <div className="callback-date-range" role="group" aria-label="Filtrar por intervalo de datas">
      <div className="callback-date-range-title"><CalendarDays size={17}/><span>Data da chamada<small>Entre</small></span></div>
      <label>Data inicial<input type="date" lang="pt-BR" value={filters.start} max={filters.end || undefined} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'callback-date-error' : undefined} onChange={event => setFilters(previous => ({ ...previous, start: event.target.value }))}/></label>
      <span className="callback-date-separator">até</span>
      <label>Data final<input type="date" lang="pt-BR" value={filters.end} min={filters.start || undefined} aria-invalid={invalidRange} aria-describedby={invalidRange ? 'callback-date-error' : undefined} onChange={event => setFilters(previous => ({ ...previous, end: event.target.value }))}/></label>
      <button type="button" onClick={() => setFilters(emptyFilters())} disabled={!filters.start && !filters.end}>Todo o período</button>
      {invalidRange && <p id="callback-date-error" role="alert">A data final deve ser igual ou posterior à data inicial.</p>}
    </div>
    <div className="callback-toolbar">
      <span><BarChart3 size={15}/>{data ? 'Planilha conectada' : 'Fonte: planilha de Callback'}{data && ' · ' + rows.length + ' dias exibidos'}</span>
      <div>{data && <small>Atualizado às {new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small>}
        <button type="button" className="callback-refresh" disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>Atualizar</button>
      </div>
    </div>
    {error && <div role="alert" className="ticket-error">{error}</div>}
    {loading ? <div className="ticket-empty" role="status"><Loader2 className="animate-spin" size={24}/><p>Carregando indicadores de Callback…</p></div> : data && <>
      <section className="callback-table-card" aria-label="Indicadores diários de callback">
        <div className="callback-table-scroll" role="region" aria-label="Tabela de Callback por data" tabIndex={0}>
          <table className="callback-main-table">
            <caption className="sr-only">Indicadores de Callback por dia. Totais e percentuais recalculados para os filtros selecionados.</caption>
            <colgroup><col className="callback-date-col"/>{columns.map(([, key]) => <col key={key}/>)}</colgroup>
            <thead><tr><th scope="col" className="callback-date-cell">Data</th>{columns.map(([label, key, note, group]) => <th key={key} scope="col" className={'cb-' + group} title={note}><span>{label}</span></th>)}</tr></thead>
            <tbody>{rows.length ? rows.map(row => <tr key={row.date}>
              <th scope="row" className="callback-date-cell">{callbackDateLabels(row.date).dias}</th>
              {columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group + (key.endsWith('Rate') ? ' callback-rate' : '')} title={row[key] === null ? note : undefined}>{valueOf(row, key)}</td>)}
            </tr>) : <tr><td colSpan={16} className="callback-no-results">Nenhum registro para os filtros selecionados.</td></tr>}</tbody>
            {rows.length > 0 && <tfoot><tr><th scope="row" className="callback-date-cell">Total</th>{columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group} title={total[key] === null ? note : undefined}>{valueOf(total, key)}</td>)}</tr></tfoot>}
          </table>
        </div>
        <div className="callback-table-legend"><span><i className="callback-dot received"/>Recebimento</span><span><i className="callback-dot callback"/>Callback</span><span><i className="callback-dot focus"/>Foco</span><p>{number(total.mixed)} interações Entrada/Saída separadas no período.</p></div>
      </section>
      <div className="callback-notice"><AlertCircle size={15}/><p><strong>—</strong> indica definição ou fonte pendente. Sucesso significa conversa com o cliente, não comprova atendimento concluído. <a href="https://docs.google.com/spreadsheets/d/1Egx88GkeZ9ZHQrijClJEXIEDlQBy-ImuW_G92uR65R4/edit" target="_blank" rel="noreferrer" className="underline">Abrir planilha</a></p></div>
    </>}
    <details className="bko-panel callback-section"><summary>Como os indicadores são calculados</summary><ul>
      <li>Recebidas: IDs distintos de voz com direção Entrada. Entrada/Saída fica separado enquanto seu tratamento no recebimento é validado.</li>
      <li>Atendidas: aguarda confirmação da contagem por atendimento/segmento na extração. Contar nomes de operadores não substitui essa métrica.</li>
      <li>Atendidas únicas: IDs distintos de voz e direção Entrada, com operador e Total de conversas maior que zero. Vários operadores na mesma conversa não multiplicam o indicador.</li>
      <li>Finalizadas: exige tabulação conclusiva validada. Queda, ligação muda, falta de interação, erro sistêmico, valores vazios e classificações desconhecidas não comprovam conclusão. O número permanece pendente até concluir a classificação.</li>
      <li>Elegíveis e resultados vêm da aba Callbacks, uma vez por ID original. As cinco tabulações elegíveis são QUEDA DE LIGAÇÃO, Ligação muda/caída, LIGACAO MUDA, Erro sistêmico e Falta de interação, no canal de voz e direção Entrada.</li>
      <li>Regra de vínculo da planilha: ANI da entrada com DNIS da saída, operador em comum e início do retorno até 30 minutos após o término da origem. Havendo várias candidatas, usa-se a origem elegível mais recente; cada saída pertence a uma única origem.</li>
      <li>Realizado exige ao menos uma saída vinculada. Sucesso exige ao menos uma tentativa com Total de conversas positivo; Insucesso indica tentativas com zero ou vazio. Sucesso não comprova conclusão da orientação.</li>
      <li>Sem saída identificada é apresentado como não realizado na base disponível; arquivos ausentes e retornos fora dos critérios podem afetar essa classificação. Entrada/Saída não é somada automaticamente aos resultados principais.</li>
      <li>As taxas são: realizados ÷ elegíveis; sucesso ÷ realizados; sem sucesso ÷ realizados. Tentativas adicionais não multiplicam o número de chamadas originais.</li>
      <li>Potencial de registros aguarda definição. Registro no Foco depende de fonte separada; sua taxa exige potencial validado e o mesmo período nas duas bases.</li>
      <li>Cada linha usa a data da chamada original. O intervalo inclui a data inicial e a data final e atualiza a tabela, os totais e os percentuais. Sem uma das datas, esse limite fica aberto. Todo o período limpa a seleção. Use Atualizar depois de atualizar a planilha.</li>
    </ul><p className="callback-note"><a href="https://help.genesys.cloud/faqs/what-is-the-difference-between-the-answered-and-handle-metrics/" target="_blank" rel="noreferrer" className="underline">Referência: Genesys — diferença entre Answered e Handle</a></p></details>
  </section>;
}
