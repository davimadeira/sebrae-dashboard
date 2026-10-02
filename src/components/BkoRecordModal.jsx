import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Save, RotateCcw } from 'lucide-react';
const groups = [
  { title: 'Identificação do chamado', description: 'Protocolo, origem e abertura do atendimento.', indexes: [0, 1, 2, 4, 5, 6, 7] },
  { title: 'Análise e tratativa', description: 'Classificação, retorno e observações da equipe.', indexes: [3, 8, 9, 10, 11, 13, 14] },
  { title: 'Finalização e registro', description: 'Responsáveis, encerramento e acompanhamento.', indexes: [12, 15, 16, 17, 18, 19, 20, 21] },
];
export default function BkoRecordModal({ user, onClose, onSaved }) {
  const [columns, setColumns] = useState([]), [fields, setFields] = useState([]), [values, setValues] = useState([]);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [saved, setSaved] = useState(null), [reload, setReload] = useState(0);
  const busy = useRef(false);
  const api = async (method, body) => {
    const token = await user.getIdToken(true);
    const response = await fetch('/api/bko-records', { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    let result; try { result = await response.json(); } catch { throw new Error('Serviço de cadastro indisponível.'); }
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
    return result;
  };
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api('GET').then(result => { if (active) { setColumns(result.headers); setFields(result.fields); setValues(result.headers.map(() => '')); } }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [user, reload]);
  useEffect(() => {
    const guard = event => { if (values.some(Boolean) && !saved) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, [values, saved]);
  const setValue = (index, value) => setValues(previous => previous.map((old, i) => i === index ? value : old));
  const status = values[2] ? (values[15] ? 'Concluído' : 'Pendente') : 'Aguardando data de abertura';
  const submit = async event => {
    event.preventDefault(); if (busy.current || saved) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const payload = values.map((value, i) => fields[i]?.type === 'date' && value ? value.split('-').reverse().join('/') : value);
      const result = await api('POST', { columns, values: payload }); setSaved({ protocol: values[0], range: result.range });
    } catch (err) { setError(err.message); } finally { busy.current = false; setSaving(false); }
  };
  const reset = () => { if (saved || !values.some(Boolean) || window.confirm('Limpar os campos deste chamado?')) { setValues(columns.map(() => '')); setSaved(null); setError(''); } };
  const renderField = index => {
    const field = fields[index]; if (!field || !columns[index]) return null;
    const id = `bko-field-${index}`, options = field.options || [];
    const common = { id, value: values[index] || '', onChange: e => setValue(index, e.target.value), required: index === 0, className: 'bko-input', maxLength: 10000 };
    return <div key={index} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{field.name}{index === 0 && <span className="text-blue-600"> *</span>}</label>
      {field.type === 'calculated' ? <><input id={id} className="bko-input bko-calculated" value={status} readOnly /><p className="mt-1 text-xs text-slate-500">Calculado a partir das datas de abertura e finalização.</p></> :
        options.length && field.strict ? <select {...common}><option value="">Selecione uma opção</option>{options.map(option => <option key={option}>{option}</option>)}</select> :
          field.type === 'textarea' ? <textarea {...common} rows={3} placeholder="Descreva as informações do atendimento" /> :
            <><input {...common} onInput={field.type === 'date' ? e => setValue(index, e.currentTarget.value) : undefined} type={field.type === 'date' ? 'date' : 'text'} list={options.length ? `${id}-options` : undefined} placeholder={index === 0 ? 'Informe o número do protocolo' : options.length ? 'Digite para buscar ou informar um nome' : 'Preencha se aplicável'} />{options.length > 0 && <datalist id={`${id}-options`}>{options.map(option => <option value={option} key={option} />)}</datalist>}</>}
    </div>;
  };
  return <section aria-labelledby="bko-title" className="bko-registration">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="bko-eyebrow">OPERAÇÃO BKO</p><h1 id="bko-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Adicionar chamado</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Registre e acompanhe os atendimentos da equipe.</p></div><span className="bko-access-badge">Acesso BKO</span></div>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}{!columns.length && <button onClick={() => setReload(n => n + 1)} className="ml-3 underline">Tentar novamente</button>}</div>}
    {loading ? <div role="status" className="bko-panel flex items-center gap-3 p-8"><Loader2 className="animate-spin" />Carregando campos e opções…</div> : saved ? <div className="bko-panel p-8" role="status"><CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" /><h2 className="text-xl font-bold">Chamado {saved.protocol} registrado</h2><p className="my-3 text-sm text-slate-500">Salvo em {saved.range || 'Preenchimento'}. O status é calculado automaticamente.</p><div className="mt-6 flex flex-wrap gap-3"><button onClick={reset} className="bko-primary">Adicionar outro chamado</button><button onClick={() => { onClose(); onSaved(); }} className="bko-secondary">Ver indicadores atualizados</button></div></div> : columns.length > 0 && <form onSubmit={submit}>
      <p className="mb-5 text-xs text-slate-500">Os campos com * são obrigatórios. As opções seguem o cadastro da equipe.</p>
      <fieldset disabled={saving} className="space-y-5">{groups.map((group, i) => <section className="bko-panel" key={group.title}><div className="flex items-center gap-4 border-b border-slate-100 p-5 dark:border-slate-700"><span className="bko-step">0{i + 1}</span><div><h2 className="font-bold">{group.title}</h2><p className="mt-1 text-xs text-slate-500">{group.description}</p></div></div><div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:p-7">{group.indexes.map(renderField)}</div></section>)}{columns.length > 22 && <section className="bko-panel grid gap-5 p-6 sm:grid-cols-2">{columns.slice(22).map((_, i) => renderField(i + 22))}</section>}</fieldset>
      <div className="bko-savebar"><p className="text-xs text-slate-500">Revise as informações antes de salvar.</p><div className="flex gap-3"><button type="button" disabled={saving} onClick={reset} className="bko-secondary"><RotateCcw size={16} />Limpar</button><button disabled={saving} className="bko-primary">{saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}{saving ? 'Salvando…' : 'Salvar chamado'}</button></div></div>
    </form>}
  </section>;
}
