export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function normalizedDate(value) {
  const text=String(value || '');
  const br=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(text);
  const iso=br ? `${br[3]}-${br[2]}-${br[1]}` : text.slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const date=new Date(`${iso}T12:00:00`);
  return Number.isFinite(+date)&&dateKey(date)===iso ? iso : '';
}
export function inDateRange(value,{start='',end=''}={}) {
  if(!start&&!end)return true;
  const date=normalizedDate(value);
  return Boolean(date&&(!start||date>=start)&&(!end||date<=end));
}
export function presetRange(name,today=new Date()) {
  let start=new Date(today.getFullYear(),today.getMonth(),today.getDate()),end=new Date(start);
  if(name==='Todo o período')return {start:'',end:''};
  if(name==='Ontem'){start.setDate(start.getDate()-1);end=new Date(start);}
  if(name==='Últimos 7 dias')start.setDate(start.getDate()-6);
  if(name==='Esta semana'||name==='Semana passada'){
    start.setDate(start.getDate()-start.getDay()-(name==='Semana passada'?7:0));
    end=new Date(start);end.setDate(end.getDate()+6);
  }
  if(name==='Este mês'){start.setDate(1);end=new Date(start.getFullYear(),start.getMonth()+1,0);}
  if(name==='Mês passado'){start=new Date(start.getFullYear(),start.getMonth()-1,1);end=new Date(start.getFullYear(),start.getMonth()+1,0);}
  return {start:dateKey(start),end:dateKey(end)};
}
