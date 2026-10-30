import DateRangePicker from './DateRangePicker';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { callbackDateLabels, filterCallbackDateRange, summarizeCallbackRows } from '../utils/callbackView';

const number = value => typeof value === 'number' ? value.toLocaleString('pt-BR') : '—';
const percent = value => typeof value === 'number' ? (value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—';
const emptyFilters = () => ({ start: '', end: '' });
const columns = [
  ['Atendidas', 'received', 'Voz de entrada; mistos separados', 'volume'],
  ['Atendidas únicas', 'unique', 'IDs de entrada com operador e conversa positiva', 'volume'],
  ['Finalizadas', 'finished', 'Interações sem necessidade de callback + callbacks com sucesso, por ID original', 'volume'],
  ['Elegíveis para callback', 'eligible', 'Interações de voz com uma das tabulações elegíveis', 'return'],
  ['Callback realizado', 'performed', 'Interações cujo ANI começa com sip:', 'return'],
  ['% realizado', 'performedRate', 'Realizados ÷ elegíveis', 'return'],
  ['Callback com sucesso', 'success', 'Callback SIP com Total de conversas maior que zero', 'return'],
  ['% com sucesso', 'successRate', 'Sucesso ÷ realizados', 'return'],
  ['Callback sem sucesso', 'failed', 'Callback SIP com Total de conversas vazio ou zero', 'return'],
  ['% sem sucesso', 'failedRate', 'Sem sucesso ÷ realizados', 'return'],
  ['Callback não realizado', 'pending', 'Elegíveis menos callbacks SIP realizados', 'return'],
  ['Potencial de registros', 'potential', 'Finalizadas menos Teste de URA e callbacks sem sucesso', 'focus'],
  ['Registro no Foco', 'registered', 'Registros de telefonia na aba Foco, pela data de abertura', 'focus'],
  ['% registro no Foco', 'registeredRate', 'Registros no Foco ÷ potencial de registros', 'focus'],
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

  const rows = useMemo(() => filterCallbackDateRange(data?.rows || [], filters), [data, filters]);
  const total = useMemo(() => summarizeCallbackRows(rows), [rows]);

  return <section className="callback-page callback-compact">
    <header className="callback-panel-heading">
      <div className="callback-heading-copy"><h1>Callback</h1>
        <p><span className={'callback-connection-dot' + (data ? ' is-connected' : '')}/>{data ? rows.length + ' dias no período' : 'Indicadores de atendimento'}{data && <span> · Atualizado às {new Date(data.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>}</p>
      </div>
      <div className="callback-heading-actions">
        <DateRangePicker value={filters} onChange={setFilters} label="Data da chamada"/>
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
            <thead><tr><th scope="col" className="callback-date-cell">Data</th>{columns.map(([label, key, note, group]) => <th key={key} scope="col" className={'cb-' + group} title={note}><span>{label}</span></th>)}</tr></thead>
            <tbody>{rows.length ? rows.map(row => <tr key={row.date}>
              <th scope="row" className="callback-date-cell">{callbackDateLabels(row.date).dias}</th>
              {columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group + (key.endsWith('Rate') ? ' callback-rate' : '')} title={row[key] === null ? note : undefined}>{valueOf(row, key)}</td>)}
            </tr>) : <tr><td colSpan={columns.length + 1} className="callback-no-results">Nenhum registro para os filtros selecionados.</td></tr>}</tbody>
            {rows.length > 0 && <tfoot><tr><th scope="row" className="callback-date-cell">Total</th>{columns.map(([, key, note, group]) => <td key={key} className={'cb-' + group} title={total[key] === null ? note : undefined}>{valueOf(total, key)}</td>)}</tr></tfoot>}
          </table>
        </div>
        <div className="callback-table-legend"><span><i className="callback-dot received"/>Recebimento</span><span><i className="callback-dot callback"/>Callback</span><span><i className="callback-dot focus"/>Foco</span><p>{number(total.mixed)} interações Entrada/Saída separadas no período.</p></div>
      </section>
      <div className="callback-summary-cards" aria-label="Resumo do período filtrado">
        <div><span>Elegíveis</span><strong>{loading || !data ? '—' : number(total.eligible)}</strong></div>
        <div><span>Realizados</span><strong>{loading || !data ? '—' : number(total.performed)}</strong></div>
        <div><span>Com sucesso</span><strong>{loading || !data ? '—' : percent(total.successRate)}</strong></div>
      </div>
      <div className="callback-notice"><AlertCircle size={15}/><p><strong>—</strong> indica definição ou fonte pendente. Sucesso significa conversa com o cliente, não comprova atendimento concluído. <a href="https://docs.google.com/spreadsheets/d/1Egx88GkeZ9ZHQrijClJEXIEDlQBy-ImuW_G92uR65R4/edit" target="_blank" rel="noreferrer" className="underline">Abrir planilha</a></p></div>
    </>}
    <details className="bko-panel callback-section"><summary>Como os indicadores são calculados</summary><ul>
      <li>Atendidas: nome de exibição do volume de IDs distintos de voz com direção Entrada. Entrada/Saída fica separado enquanto seu tratamento nesse total é validado.</li>
      <li>Atendidas únicas: IDs distintos de voz e direção Entrada, com operador e Total de conversas maior que zero. Vários operadores na mesma conversa não multiplicam o indicador.</li>
      <li>Finalizadas: interações de entrada que não são elegíveis, somadas aos callbacks SIP com sucesso. Callbacks sem sucesso não entram nesse total.</li>
      <li>Elegíveis: interações de voz com as tabulações Queda de ligação, Ligação muda, Erro sistêmico ou Falta de interação, independentemente da direção.</li>
      <li>Callback realizado: interação cujo ANI começa com <strong>sip:</strong>. Não há vínculo por telefone, operador ou limite de horário.</li>
      <li>Sucesso: callback SIP com Total de conversas maior que zero. Sem sucesso: callback SIP com Total de conversas vazio ou zero.</li>
      <li>Callback não realizado é a diferença entre elegíveis e realizados, sem resultado negativo quando houver mais callbacks SIP do que elegíveis.</li>
      <li>As taxas são: realizados ÷ elegíveis; sucesso ÷ realizados; sem sucesso ÷ realizados. Tentativas adicionais não multiplicam o número de chamadas originais.</li>
      <li>Potencial de registros é Finalizadas menos as interações de Teste de URA (na base atual, “Teste de atendimento”) e callbacks sem sucesso.</li>
      <li>Registro no Foco é a quantidade de registros de telefonia na aba Foco, na data de abertura correspondente. Não há cruzamento com Marca externa ou Protocolo CNR.</li>
      <li>% registro no Foco é a quantidade registrada dividida pelo potencial no mesmo período. Quando a aba Foco não estiver disponível, o painel exibe — sem interromper os demais indicadores.</li>
      <li>Cada linha usa a data da chamada original. O intervalo inclui a data inicial e a data final e atualiza a tabela, os totais e os percentuais. Escolha os dois dias e clique em Aplicar. Todo o período remove o recorte após aplicar. Use Atualizar depois de atualizar a planilha.</li>
    </ul><p className="callback-note"><a href="https://help.genesys.cloud/faqs/what-is-the-difference-between-the-answered-and-handle-metrics/" target="_blank" rel="noreferrer" className="underline">Referência: Genesys — diferença entre Answered e Handle</a></p></details>
  </section>;
}
