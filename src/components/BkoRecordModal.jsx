import { useEffect, useRef, useState } from 'react';

export default function BkoRecordModal({ user, onClose, onSaved }) {
  const [columns, setColumns] = useState([]);
  const [values, setValues] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  const dialog = useRef(null);
  const api = async (method, body) => {
    const token = await user.getIdToken(true);
    const response = await fetch('/api/bko-records', {
      method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let result;
    try { result = await response.json(); } catch { throw new Error('Serviço de cadastro indisponível.'); }
    if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
    return result;
  };
  useEffect(() => {
    dialog.current.showModal();
    let active = true;
    api('GET').then(result => {
      if (active) { setColumns(result.headers); setValues(result.headers.map(() => '')); }
    }).catch(err => active && setError(err.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  const submit = async event => {
    event.preventDefault();
    if (busy.current || saved) return;
    busy.current = true; setSaving(true); setError('');
    try {
      await api('POST', { columns, values });
      setSaved(true);
    } catch (err) { setError(err.message); }
    finally { busy.current = false; setSaving(false); }
  };
  const close = () => { if (!busy.current) { onClose(); if (saved) onSaved(); } };
  return <dialog ref={dialog} aria-labelledby="bko-title" onCancel={event => { event.preventDefault(); close(); }} className="w-[95vw] max-w-3xl max-h-[90vh] rounded-xl bg-white p-6 text-gray-900 shadow-xl backdrop:bg-slate-950/60 dark:bg-gray-800 dark:text-white">
    <div className="mb-5 flex items-center justify-between gap-4"><h2 id="bko-title" className="text-xl font-bold">Adicionar registro BKO</h2><button type="button" disabled={saving} onClick={close} className="rounded border px-3 py-2">Fechar</button></div>
    {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p>}
    {loading ? <p role="status">Carregando campos da planilha…</p> : saved ? <div role="status"><p className="mb-4 text-emerald-600">Registro salvo na planilha.</p><button autoFocus onClick={close} className="rounded-lg bg-sebrae-blue px-4 py-2 text-white">Concluir e atualizar painel</button></div> : columns.length > 0 && <form onSubmit={submit}>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-300">Preencha os campos conforme a planilha. O primeiro campo é obrigatório. Datas: DD/MM/AAAA.</p>
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
        {columns.map((column, index) => column ? <label key={index} className="flex flex-col gap-1 text-sm"><span>{column}{index === 0 ? ' *' : ''}</span><textarea rows={2} required={index === 0} maxLength={10000} value={values[index]} onChange={event => setValues(previous => previous.map((value, i) => i === index ? event.target.value : value))} className="w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-900" /></label> : null)}
      </fieldset>
      <div className="mt-6 flex justify-end"><button disabled={saving} className="rounded-lg bg-sebrae-blue px-5 py-2 text-white disabled:opacity-50">{saving ? 'Salvando…' : 'Salvar registro'}</button></div>
    </form>}
  </dialog>;
}
