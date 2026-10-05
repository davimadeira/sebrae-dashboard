export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export const defaults = { open: 'aberto;aberta;pendente;em andamento;em análise;em tratativa', closed: 'concluído;concluída;finalizado;finalizada;encerrado;encerrada', success: 'sim;sucesso;com sucesso', failure: 'não;sem sucesso;insucesso', n2: 'sim', age: 7 };
const includes = (list, value) => String(list || '').split(';').map(normalize).filter(Boolean).includes(normalize(value));
export function day(value) {
 const text=String(value||'').trim();
 const match=/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})(?:\s|$)/.exec(text) || /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(text);
 if(!match) return null;
 const iso=match[1].length===4; const y=iso?+match[1]:(match[3].length===2?2000+ +match[3]:+match[3]); const m=+match[2], d=iso?+match[3]:+match[1];
 const time=Date.UTC(y,m-1,d);const date=new Date(time);
 return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?time:null;
}
export const today = () => { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=t=>parts.find(p=>p.type===t).value;return Date.UTC(+get('year'),+get('month')-1,+get('day')); };
export function classify(record, rules=defaults, now=today()) {
 const v=record.values;
 const lifecycle=includes(rules.closed,v[9])?'closed':includes(rules.open,v[9])?'open':'unknown';
 const outcome=value=>includes(rules.success,value)?'success':includes(rules.failure,value)?'failure':'unknown';
 const attempts=[14,17,20,23].map((i,index)=>({number:index+1,operator:(v[i]||'').trim(),status:v[i+1]||'',detail:v[i+2]||'',present:Boolean((v[i+1]||'').trim()||(v[i+2]||'').trim()),outcome:outcome(v[i+1])}));
 const start=day(v[0]);const age=start!==null&&start<=now?Math.floor((now-start)/86400000):null;
 const owner=[...attempts].reverse().find(a=>a.operator)?.operator||'';
 return {...record,lifecycle,attempts,start,age,owner,attemptCount:attempts.filter(a=>a.present).length,result:outcome(v[26]),n2:includes(rules.n2,v[29])};
}
export function group(rows, value) { const map=new Map();for(const row of rows){const key=value(row)||'Não informado';map.set(key,(map.get(key)||0)+1);}return [...map].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)); }
export function analyze(records,rules=defaults,now=today()) {
 const rows=records.map(r=>classify(r,rules,now));const open=rows.filter(r=>r.lifecycle==='open');const dated=open.filter(r=>r.age!==null);
 const success=rows.filter(r=>r.result==='success').length; const failure=rows.filter(r=>r.result==='failure').length;
 const priorities=open.map(r=>({...r,flags:[r.age!==null&&r.age>=rules.age?'Tempo em aberto':null,!r.owner?'Sem responsável':null,r.attemptCount>=3?'3 ou mais tentativas':null].filter(Boolean)})).filter(r=>r.flags.length).sort((a,b)=>b.flags.length-a.flags.length||(b.age??-1)-(a.age??-1)||a.row-b.row);
 const attempts=[0,1,2,3].map(i=>{const present=rows.filter(r=>r.attempts[i].present);return {number:i+1,total:present.length,success:present.filter(r=>r.attempts[i].outcome==='success').length,failure:present.filter(r=>r.attempts[i].outcome==='failure').length,unknown:present.filter(r=>r.attempts[i].outcome==='unknown').length};});
 const channel=index=>group(rows,r=>r.values[index]).map(g=>{const subset=rows.filter(r=>(r.values[index]||'Não informado')===g.label);return {...g,success:subset.filter(r=>r.result==='success').length,classified:subset.filter(r=>r.result!=='unknown').length};});
 const terms=group(rows.flatMap(r=>{const tokens=[...new Set(normalize(`${r.values[7]||''} ${r.values[8]||''}`).match(/[a-z]{4,}/g)||[])];return tokens.filter(t=>!new Set(['para','pela','pelo','pelos','pelas','como','mais','muito','cliente','sobre','essa','esse','esta','este','isso','ainda','pois','quando','onde','qual','porque','tambem','foram','seria','fazer','feito','nao','atendimento']).has(t)).map(term=>({term}));}),r=>r.term).slice(0,10);
 return {rows,open,success,failure,priorities,attempts,statuses:group(rows,r=>r.values[9]),closed:rows.filter(r=>r.lifecycle==='closed').length,unknown:rows.filter(r=>r.lifecycle==='unknown').length,n2:rows.filter(r=>r.n2),averageAge:dated.length?dated.reduce((sum,r)=>sum+r.age,0)/dated.length:null,missingDates:open.length-dated.length,ages:[['0–2 dias',r=>r.age<=2],['3–6 dias',r=>r.age>=3&&r.age<=6],['7–14 dias',r=>r.age>=7&&r.age<=14],['15+ dias',r=>r.age>=15]].map(([label,test])=>({label,count:dated.filter(test).length})),channels:channel(12),conclusionChannels:channel(27),operators:group(rows,r=>r.owner),terms};
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
