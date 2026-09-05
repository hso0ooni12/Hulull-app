/* Hulull financial reporting: derived solely from recorded cash vouchers. */
'use strict';
const ReportMath=(()=>{
 const dayMS=86400000;
 const cents=row=>Math.round(Number(row.amount||0)*100);
 const iso=date=>date.toISOString().slice(0,10);
 const parse=value=>new Date(value+'T00:00:00Z');
 const shift=(value,days)=>iso(new Date(parse(value).getTime()+days*dayMS));
 const days=(from,to)=>Math.round((parse(to)-parse(from))/dayMS)+1;
 function sum(rows,type){return rows.filter(r=>!type||r.entry_type===type).reduce((n,r)=>n+cents(r),0)/100}
 function aggregate(rows,from='',to=''){
  const incoming=rows.filter(r=>r.entry_type==='incoming'),outgoing=rows.filter(r=>r.entry_type==='outgoing');
  const sumIn=sum(incoming),sumOut=sum(outgoing),net=Math.round((sumIn-sumOut)*100)/100;
  const activeDays=new Set(rows.map(r=>r.entry_date)).size;
  const calendarDays=from&&to?days(from,to):activeDays;
  const grouped=(key)=>{
   const map=new Map();
   for(const r of rows){const k=String(key(r)||'غير محدد');if(!map.has(k))map.set(k,{key:k,inCents:0,outCents:0,count:0});const g=map.get(k);g[r.entry_type==='incoming'?'inCents':'outCents']+=cents(r);g.count++}
   return [...map.values()].map(g=>({key:g.key,incoming:g.inCents/100,outgoing:g.outCents/100,net:(g.inCents-g.outCents)/100,count:g.count}));
  };
  return {rows,incoming,outgoing,sumIn,sumOut,net,count:rows.length,activeDays,calendarDays,
   averageDailyIn:calendarDays?sumIn/calendarDays:0,averageDailyOut:calendarDays?sumOut/calendarDays:0,
   incomingParties:new Set(incoming.map(r=>String(r.party_name||'').trim()).filter(Boolean)).size,
   outgoingParties:new Set(outgoing.map(r=>String(r.party_name||'').trim()).filter(Boolean)).size,
   outRatio:sumIn>0?sumOut/sumIn:null,
   months:grouped(r=>r.entry_date.slice(0,7)).sort((a,b)=>a.key.localeCompare(b.key)),
   payments:grouped(r=>r.payment_method),parties:grouped(r=>String(r.party_name||'').trim())};
 }
 function range(preset,today,customFrom='',customTo=''){
  let from='',to=today,prevFrom='',prevTo='';
  const current=parse(today),y=current.getUTCFullYear(),m=current.getUTCMonth(),d=current.getUTCDate();
  if(preset==='all')return {from:'',to:'',prevFrom:'',prevTo:''};
  if(preset==='today'){from=today;prevFrom=prevTo=shift(today,-1)}
  else if(preset==='month'){
   from=iso(new Date(Date.UTC(y,m,1)));prevFrom=iso(new Date(Date.UTC(y,m-1,1)));
   prevTo=iso(new Date(Date.UTC(y,m-1,Math.min(d,new Date(Date.UTC(y,m,0)).getUTCDate()))));
  }else if(preset==='year'){
   from=`${y}-01-01`;prevFrom=`${y-1}-01-01`;
   prevTo=iso(new Date(Date.UTC(y-1,m,Math.min(d,new Date(Date.UTC(y-1,m+1,0)).getUTCDate()))));
  }else{
   from=customFrom;to=customTo;
   if(!from||!to||!validISODate(from)||!validISODate(to)||from>to)throw new Error('حدد تاريخ بداية ونهاية صحيحين؛ البداية لا تتجاوز النهاية.');
   prevTo=shift(from,-1);prevFrom=shift(from,-days(from,to));
  }
  return {from,to,prevFrom,prevTo};
 }
 const within=(rows,from,to)=>rows.filter(r=>(!from||r.entry_date>=from)&&(!to||r.entry_date<=to));
 const change=(current,previous)=>previous>0?((current-previous)/previous)*100:null;
 return {sum,aggregate,range,within,change,days};
})();
function currentReportRange(){return ReportMath.range($('reportPreset').value||'month',todayISO(),$('reportFrom').value,$('reportTo').value)}
function currentReport(){const range=currentReportRange();return {range,metrics:ReportMath.aggregate(ReportMath.within(state.entries,range.from,range.to),range.from,range.to)}}
function bindReports(){
 $('reportPreset').addEventListener('change',()=>{const custom=$('reportPreset').value==='custom';$('reportCustomDates').classList.toggle('hidden',!custom);if(!custom)renderFinancialReports()});
 $('reportApply').addEventListener('click',renderFinancialReports);
 for(const scope of ['dashboard','incoming','outgoing','all'])$('excel-'+scope).addEventListener('click',()=>exportExcelReport(scope));
 $('reportFrom').value=todayISO().slice(0,7)+'-01';$('reportTo').value=todayISO();
}
function reportTable(id,rows){
 const body=$(id);body.replaceChildren();
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='لا توجد بيانات في الفترة المحددة';tr.append(td);body.append(tr);return}
 for(const values of rows){const tr=document.createElement('tr');values.forEach(value=>tr.append(tdText(String(value))));body.append(tr)}
}
function renderFinancialReports(){
 if(!$('reportPreset'))return;
 let report;
 try{report=currentReport();$('reportError').textContent=''}catch(error){$('reportError').textContent=error.message;return}
 const {range:r,metrics:m}=report;
 const money={periodIn:m.sumIn,periodOut:m.sumOut,periodNet:m.net,dailyIn:m.averageDailyIn,dailyOut:m.averageDailyOut};
 for(const [id,value]of Object.entries(money))$(id).textContent=formatMoney(value);
 $('periodCount').textContent=m.count;$('periodPartiesIn').textContent=m.incomingParties;$('periodPartiesOut').textContent=m.outgoingParties;
 $('periodActiveDays').textContent=m.activeDays;$('periodOutRatio').textContent=m.outRatio===null?'غير متاح':(m.outRatio*100).toFixed(1)+'%';
 $('periodNet').style.color=m.net<0?'#b91c1c':'#15803d';
 $('reportRangeLabel').textContent=r.from?`${formatDate(r.from)} — ${formatDate(r.to)} | ${m.calendarDays} يوم تقويمي`:'جميع السندات | المتوسط اليومي محسوب على أيام الحركة فقط';
 if(r.prevFrom){
  const previous=ReportMath.aggregate(ReportMath.within(state.entries,r.prevFrom,r.prevTo));
  const changeText=(v,p)=>{const c=ReportMath.change(v,p);return c===null?'لا توجد قاعدة مقارنة موجبة':`${c>0?'+':''}${c.toFixed(1)}%`};
  $('reportComparison').textContent=`مقارنة مع ${formatDate(r.prevFrom)} — ${formatDate(r.prevTo)}: تغير الوارد ${changeText(m.sumIn,previous.sumIn)}، تغير الصادر ${changeText(m.sumOut,previous.sumOut)}، فرق صافي الحركة ${formatMoney(m.net-previous.net)}.`;
 }else $('reportComparison').textContent='اختر فترة محددة لإظهار المقارنة.';
 reportTable('reportMonths',m.months.map(g=>[g.key,formatMoney(g.incoming),formatMoney(g.outgoing),formatMoney(g.net),g.count]));
 reportTable('reportPayments',m.payments.map(g=>[getPaymentAr(g.key),formatMoney(g.incoming),formatMoney(g.outgoing),formatMoney(g.net),g.count]));
 const topIn=[...m.parties].filter(g=>g.incoming>0).sort((a,b)=>b.incoming-a.incoming).slice(0,5);
 const topOut=[...m.parties].filter(g=>g.outgoing>0).sort((a,b)=>b.outgoing-a.outgoing).slice(0,5);
 reportTable('reportTopIn',topIn.map(g=>[g.key,formatMoney(g.incoming)]));reportTable('reportTopOut',topOut.map(g=>[g.key,formatMoney(g.outgoing)]));
 const today=todayISO();
 $('opsPending').textContent=state.bookings.filter(b=>b.status==='pending').length;
 $('opsToday').textContent=state.scheduleTasks.filter(t=>t.date===today&&!t.completed).length;
 $('opsOverdue').textContent=state.scheduleTasks.filter(t=>t.date<today&&!t.completed).length;
 const tasks=state.scheduleTasks.filter(t=>(!r.from||t.date>=r.from)&&(!r.to||t.date<=r.to));
 $('opsCompletion').textContent=tasks.length?(100*tasks.filter(t=>t.completed).length/tasks.length).toFixed(1)+'%':'لا توجد مهام';
}
