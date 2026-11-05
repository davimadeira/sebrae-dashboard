export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const defaults = { open: 'em aberto;aberto;aberta;pendente;em andamento;em análise;em tratativa;não atendido;retornar para cliente;em acompanhamento;problema não resolvido;escalonado;impossivel completar a chamada;número pertence a outra pessoa', closed: 'concluído;concluída;finalizado;finalizada;encerrado;encerrada;tratado;tratada', success: 'sim;sucesso;com sucesso;ligação bem sucedida', failure: 'não;sem sucesso;insucesso;não atendido;caixa postal;cliente não atende;fora de area;numero inexistente;impossivel completar a chamada;número pertence a outra pessoa', n2: 'sim;encaminhado para ouvidoria;escalonado para ouvidoria', age: 7 };
const includes = (list, value) => String(list || '').split(';').map(normalize).filter(Boolean).includes(normalize(value));
export function day(value) {
 const text=String(value||'').trim();
 const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?:\s|$)/.exec(text) || /^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/.exec(text);
 if(!match) return null;
 const iso=match[1].length===4; const y=iso?+match[1]:(match[3].length===2?2000+ +match[3]:+match[3]); const m=+match[2], d=iso?+match[3]:+match[1];
 const time=Date.UTC(y,m-1,d);const date=new Date(time);
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?time:null;
}
export const today = () => { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=t=>parts.find(p=>p.type===t).value;return Date.UTC(+get('year'),+get('month')-1,+get('day')); };
export const lifecycleLabels = { open: 'Em aberto', closed: 'Concluído', unknown: 'Revisar situação' };
const npsCategories = 'neutros;detratores;promotores;promotores com comentário negativo';
// Only explicit, structured outcomes count. Narrative text is retained for review.
export function contactOutcome(value, rules=defaults) {
 return includes(rules.success,value)?'success':includes(rules.failure,value)?'failure':'unknown';
}
export function classify(record, rules=defaults, now=today()) {
 const v=record.values;
 const attempts=[14,17,20,23].map((i,index)=>{
  const status=v[i+1]||'', detail=v[i+2]||'';
  const statusOutcome=contactOutcome(status,rules), detailOutcome=contactOutcome(detail,rules);
  const conflict=statusOutcome!=='unknown'&&detailOutcome!=='unknown'&&statusOutcome!==detailOutcome;
  return {number:index+1,operator:(v[i]||'').trim(),status,detail,present:Boolean(status.trim()||detail.trim()),outcome:conflict?'unknown':detailOutcome!=='unknown'?detailOutcome:statusOutcome};
 });
 const last=[...attempts].reverse().find(a=>a.present);
 const legacyStatus=!includes(npsCategories,v[9]) ? v[9]||'' : '';
 const operationalStatus=last ? last.status : legacyStatus;
 // An unknown later contact must never resurrect the conclusion of an earlier one.
 const lifecycle=includes(rules.closed,operationalStatus)?'closed':includes(rules.open,operationalStatus)?'open':!last&&(!legacyStatus||includes('respondido;respondida',legacyStatus))?'open':'unknown';
 const start=day(v[0]);const age=start!==null&&start<=now?Math.floor((now-start)/86400000):null;
 const owner=[...attempts].reverse().find(a=>a.operator)?.operator||'';
 const focoOutcome=contactOutcome(v[26],rules);
 const result=focoOutcome!=='unknown'?focoOutcome:last?.outcome||'unknown';
 const resultSource=focoOutcome!=='unknown'?'Resultado Foco':last?.outcome&&last.outcome!=='unknown'?`${last.number}º contato (status/detalhamento)`:'Sem evidência estruturada';
 const responded=includes('respondido;respondida',legacyStatus) || includes('sim;respondido;respondida',v[13]) || day(v[10])!==null;
 return {...record,lifecycle,lifecycleLabel:lifecycleLabels[lifecycle],operationalStatus:operationalStatus||(!last?'Aguardando primeiro contato':'Sem status no último contato'),classification:v[9]||'',attempts,start,age,owner,attemptCount:attempts.filter(a=>a.present).length,result,resultSource,responded,narrativeResult:Boolean(String(v[26]||'').trim())&&focoOutcome==='unknown',n2:includes(rules.n2,v[29])||includes('escalonado',last?.status)||includes(rules.n2,last?.detail)};
}
export function group(rows, value) { const map=new Map();for(const row of rows){const key=value(row)||'Não informado';map.set(key,(map.get(key)||0)+1);}return [...map].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)); }
export function analyze(records,rules=defaults,now=today()) {
 const rows=records.map(r=>classify(r,rules,now));const open=rows.filter(r=>r.lifecycle==='open');const dated=open.filter(r=>r.age!==null);
 const success=rows.filter(r=>r.result==='success').length; const failure=rows.filter(r=>r.result==='failure').length;
 const priorities=open.map(r=>({...r,flags:[day(r.deadline)!==null&&day(r.deadline)<now?'Prazo vencido':null,r.age!==null&&r.age>=rules.age?'Tempo em aberto':null,!r.owner?'Sem responsável':null,r.attemptCount>=3?'3 ou mais tentativas':null].filter(Boolean)})).filter(r=>r.flags.length).sort((a,b)=>b.flags.length-a.flags.length||(b.age??-1)-(a.age??-1)||a.row-b.row);
 const attempts=[0,1,2,3].map(i=>{const present=rows.filter(r=>r.attempts[i].present);return {number:i+1,total:present.length,success:present.filter(r=>r.attempts[i].outcome==='success').length,failure:present.filter(r=>r.attempts[i].outcome==='failure').length,unknown:present.filter(r=>r.attempts[i].outcome==='unknown').length};});
 const channel=index=>group(rows,r=>r.values[index]).map(g=>{const subset=rows.filter(r=>(r.values[index]||'Não informado')===g.label);return {...g,success:subset.filter(r=>r.result==='success').length,classified:subset.filter(r=>r.result!=='unknown').length};});
 const terms=group(rows.flatMap(r=>{const tokens=[...new Set(normalize(`${r.values[7]||''} ${r.values[8]||''}`).match(/[a-z]{4,}/g)||[])];return tokens.filter(t=>!new Set(['para','pela','pelo','pelos','pelas','como','mais','muito','cliente','sobre','essa','esse','esta','este','isso','ainda','pois','quando','onde','qual','porque','tambem','foram','seria','fazer','feito','nao','atendimento']).has(t)).map(term=>({term}));}),r=>r.term).slice(0,10);
 return {rows,open,success,failure,priorities,attempts,statuses:group(rows,r=>r.operationalStatus),classifications:group(rows,r=>r.classification),closed:rows.filter(r=>r.lifecycle==='closed').length,unknown:rows.filter(r=>r.lifecycle==='unknown').length,n2:rows.filter(r=>r.n2),averageAge:dated.length?dated.reduce((sum,r)=>sum+r.age,0)/dated.length:null,missingDates:open.length-dated.length,ages:[['0–2 dias',r=>r.age<=2],['3–6 dias',r=>r.age>=3&&r.age<=6],['7–14 dias',r=>r.age>=7&&r.age<=14],['15+ dias',r=>r.age>=15]].map(([label,test])=>({label,count:dated.filter(test).length})),channels:channel(12),conclusionChannels:channel(27),operators:group(rows,r=>r.owner),terms};
}
// CSV RFC 4180: campos entre aspas, separadores e quebras de linha no conteúdo.
export function parseInteractions(text) {
 text=text.replace(/^\uFEFF/,'');const first=text.split(/\r?\n/,1)[0];const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=c;}
 if(quoted)throw new Error('CSV com aspas não fechadas. Exporte o arquivo novamente.');
 row.push(field);if(row.some(Boolean))rows.push(row);
 const headers=(rows.shift()||[]).map(normalize);const id=headers.indexOf('id de conversa'),direction=headers.indexOf('direcao');if(id<0||direction<0)throw new Error('O CSV precisa conter ID de conversa e Direção.');
 const date=headers.indexOf('data');const map=new Map();let blank=0;
 for(const values of rows){const key=normalize(values[id]);if(!key){blank++;continue;}const current=map.get(key)||{id:values[id].trim(),directions:[],date:values[date]||'',callback:false,count:0};const dir=values[direction]?.trim()||'Não informada';if(!current.directions.includes(dir))current.directions.push(dir);current.callback ||= ['saida','entrada/saida'].includes(normalize(dir).replace(/\s*\/\s*/g,'/'));current.count++;map.set(key,current);}
 return {map,total:rows.length,blank,duplicates:rows.length-blank-map.size,callbacks:[...map.values()].filter(r=>r.callback).length};
}
export function joinInteractions(rows, source) {return rows.map(r=>({...r,interaction:source?.map.get(normalize(r.values[6]))||null}));}
