import { useEffect, useRef, useState, useId } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { dateKey, presetRange } from '../utils/dateRange';
const presets=['Hoje','Ontem','Esta semana','Semana passada','Últimos 7 dias','Este mês','Mês passado','Todo o período'];
const months=Array.from({length:12},(_,i)=>new Date(2026,i,1).toLocaleDateString('pt-BR',{month:'long'}));
const display=value=>value?value.split('-').reverse().join('/'):'…';
export default function DateRangePicker({value={start:'',end:''},onChange,label='Período'}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(value),[month,setMonth]=useState(new Date()),[selectEnd,setSelectEnd]=useState(false),[position,setPosition]=useState({});
 const trigger=useRef(null),panel=useRef(null),id=useId();
 const close=()=>{setOpen(false);trigger.current?.focus();};
 useEffect(()=>{
  if(!open)return;
  const place=()=>{const r=trigger.current.getBoundingClientRect();const width=Math.min(560,window.innerWidth-24);setPosition({left:Math.max(12,Math.min(r.left,window.innerWidth-width-12)),top:Math.max(12,Math.min(r.bottom+8,window.innerHeight-520)),width,maxHeight:window.innerHeight-24});};
  const outside=e=>{if(!panel.current?.contains(e.target)&&!trigger.current?.contains(e.target))setOpen(false);};
  const escape=e=>{if(e.key==='Escape')close();};
  place();panel.current?.focus();document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
 },[open]);
 const choose=key=>{if(!selectEnd){setDraft({start:key,end:''});setSelectEnd(true);}else{setDraft({start:key<draft.start?key:draft.start,end:key<draft.start?draft.start:key});setSelectEnd(false);}};
 const move=delta=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+delta,1));
 return <div className="bi-date-filter"><span className="bi-date-label">{label}</span><button ref={trigger} type="button" className="bi-date-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>{if(open){close();return;}setDraft({...value});setSelectEnd(false);setMonth(value.start?new Date(`${value.start}T12:00:00`):new Date());setOpen(true);}}><CalendarDays size={16}/><span>{value.start||value.end?`${display(value.start)} — ${display(value.end)}`:'Todo o período'}</span><ChevronDown size={15}/></button>
 {open&&createPortal(<div id={id} ref={panel} tabIndex={-1} role="dialog" aria-label={`Selecionar período: ${label}`} className="bi-calendar" style={position}>
  <div className="bi-presets"><strong>ESCOLHA SEU PERÍODO</strong><div>{presets.map(name=><button type="button" key={name} onClick={()=>{const next=presetRange(name);setDraft(next);setSelectEnd(false);if(next.start)setMonth(new Date(`${next.start}T12:00:00`));}}>{name}</button>)}</div></div>
  <div className="bi-month-nav"><button type="button" aria-label="Mês anterior" onClick={()=>move(-1)}><ChevronLeft size={18}/></button><select aria-label="Mês" value={month.getMonth()} onChange={e=>setMonth(new Date(month.getFullYear(),Number(e.target.value),1))}>{months.map((name,i)=><option key={name} value={i}>{name}</option>)}</select><select aria-label="Ano" value={month.getFullYear()} onChange={e=>setMonth(new Date(Number(e.target.value),month.getMonth(),1))}>{Array.from({length:21},(_,i)=>month.getFullYear()-10+i).map(year=><option key={year}>{year}</option>)}</select><button type="button" aria-label="Próximo mês" onClick={()=>move(1)}><ChevronRight size={18}/></button></div>
  <div className="bi-months">{[0,1].map(offset=>{const first=new Date(month.getFullYear(),month.getMonth()+offset,1);const count=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();return <section key={offset}><h3>{first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</h3><div className="bi-days">{['D','S','T','Q','Q','S','S'].map((day,i)=><span className="bi-weekday" key={`w${i}`}>{day}</span>)}{Array.from({length:42},(_,i)=>{const day=i-first.getDay()+1;if(day<1||day>count)return <span key={i}/>;const key=dateKey(new Date(first.getFullYear(),first.getMonth(),day));const edge=key===draft.start||key===draft.end;const inside=draft.start&&draft.end&&key>draft.start&&key<draft.end;return <button type="button" key={i} aria-label={display(key)} aria-pressed={Boolean(edge||inside)} className={edge?'is-edge':inside?'is-range':''} onClick={()=>choose(key)}>{day}</button>;})}</div></section>;})}</div>
  <footer><div><strong>{draft.start||draft.end?`${display(draft.start)} — ${display(draft.end)}`:'Todo o período'}</strong><small>{selectEnd?'Agora escolha o último dia do período.':'Clique no primeiro e no último dia do período.'}</small></div><button type="button" onClick={close}>Cancelar</button><button type="button" className="bi-apply" disabled={selectEnd} onClick={()=>{onChange({...draft});close();}}>Aplicar</button></footer>
 </div>,document.body)}</div>;
}
