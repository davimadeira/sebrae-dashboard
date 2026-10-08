import { useEffect, useRef, useState } from 'react';
import { Save, CheckCircle2, Loader2 } from 'lucide-react';
import { fieldGroups, identityIndexes } from '../utils/npsSchema';
export default function NpsRecordForm({ user, data, record, onClose, onSaved }) {
  const { headers: columns, fields } = data;
  const initial = columns.map((_, i) => record?.values[i] || '');
  const [values, setValues] = useState(initial), [error, setError] = useState(''), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const dirty = values.some((v, i) => v !== initial[i]);
  const ids = identityIndexes(columns);
  useEffect(() => { const guard = e => { if (dirty && !saved) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [dirty, saved]);
  const close = () => { if (saved || !dirty || window.confirm('Sair sem salvar as alterações do NPS?')) onClose(); };
  const submit = async event => {
    event.preventDefault(); if (busy.current) return; busy.current = true; setSaving(true); setError('');
    try {
      const changes = values.flatMap((value, index) => value !== initial[index] ? [{ index, value }] : []);
      const response = await fetch('/api/tratativas', { method: record ? 'PATCH' : 'POST', headers: { Authorization: `Bearer ${await user.getIdToken(true)}`, 'Content-Type': 'application/json' }, body: JSON.stringify(record ? { columns, row: record.row, version: record.version, changes } : { columns, values }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Não foi possível salvar.');
      setSaved(true); onSaved();
    } catch (err) { setError(err.message); } finally { setSaving(false); busy.current = false; }
  };
  const renderField = index => {
    const field = fields[index], value = values[index] || '', id = `nps-field-${index}`;
    if (!field || !columns[index] || index === ids.date) return null;
    const update = next => setValues(old => old.map((v, i) => i === index ? next : v));
    const common = { id, className: 'bko-input', value, maxLength: 10000, onChange: e => update(e.target.value) };
    const options = field.options || [];
    const locked = field.type === 'calculated' || record?.calculated[index] || !!field.optionsError;
    return <div key={index} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}><label htmlFor={id} className="mb-2 block text-sm font-semibold">{field.name}</label>{locked ? <><input {...common} readOnly placeholder={field.optionsError ? 'Lista indisponível' : 'Calculado na planilha'}/><small className="text-slate-500">{field.optionsError || 'Atualizado automaticamente'}</small></> : options.length && field.strict ? <select {...common}><option value="">Selecione</option>{value && !options.includes(value) && <option>{value}</option>}{options.map(o => <option key={o}>{o}</option>)}</select> : field.type === 'textarea' ? <textarea {...common} rows={3} placeholder="Descreva as informações do atendimento"/> : <><input {...common} type={field.type === 'date' && (!value || /^\d{2}\/\d{2}\/\d{4}$/.test(value)) ? 'date' : 'text'} value={field.type === 'date' && /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split('/').reverse().join('-') : value} onChange={e => update(field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) ? e.target.value.split('-').reverse().join('/') : e.target.value)} onInput={field.type === 'date' ? e => update(/^\d{4}-\d{2}-\d{2}$/.test(e.currentTarget.value) ? e.currentTarget.value.split('-').reverse().join('/') : e.currentTarget.value) : undefined} list={options.length ? `${id}-options` : undefined} placeholder={options.length ? 'Selecione ou digite' : 'Preencha se aplicável'}/>{options.length > 0 && <datalist id={`${id}-options`}>{options.map(o => <option value={o} key={o}/>)}</datalist>}</>}</div>;
  };
  return <section className="bko-registration"><div className="ticket-heading"><div><p className="bko-eyebrow">ACOMPANHAMENTO NPS</p><h1>{record ? 'Editar registro' : 'Novo registro'}</h1><p>{record ? record.values[ids.name] || 'Atualize as informações do atendimento.' : 'Identificação, contatos e resultado em um só cadastro.'}</p></div><button className="bko-secondary" disabled={saving} onClick={close}>← Voltar ao NPS</button></div>
    {error && <div role="alert" className="ticket-error">{error}</div>}
    {saved ? <div className="bko-panel p-8" role="status"><CheckCircle2 className="mb-4 text-emerald-500" size={40}/><h2 className="text-xl font-bold">Registro {record ? 'atualizado' : 'criado'} com sucesso</h2><p className="my-3 text-slate-500">As informações foram salvas na planilha NPS.</p><button className="bko-primary" onClick={onClose}>Voltar aos registros</button></div> : <form onSubmit={submit}>
    <div className="ta-info mb-5"><p>{values[ids.date] ? `Início da tratativa: ${values[ids.date]}. Essa data será preservada.` : 'A data de início será preenchida automaticamente quando nome, CPF e ID Genesys estiverem preenchidos.'}</p></div>
    <fieldset disabled={saving} className="space-y-5">{fieldGroups(columns).map((group, i) => <section className="bko-panel" key={group.title}><div className="flex items-center gap-4 border-b border-slate-100 p-5 dark:border-slate-700"><span className="bko-step">{String(i + 1).padStart(2, '0')}</span><h2 className="font-bold">{group.title}</h2></div><div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:p-7">{group.indexes.map(renderField)}</div></section>)}</fieldset>
    <div className="bko-savebar"><p className="text-xs text-slate-500">As opções acompanham a planilha. Revise antes de salvar.</p><button className="bko-primary" disabled={saving || !dirty}>{saving ? <Loader2 size={17} className="animate-spin"/> : <Save size={17}/>} {saving ? 'Salvando…' : record ? 'Salvar alterações' : 'Criar registro'}</button></div></form>}
  </section>;
}
