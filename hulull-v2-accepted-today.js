'use strict';
(()=>{
  const get=id=>document.getElementById(id);
  const saToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const bookingDate=b=>b.scheduled_date||b.preferred_date||'';
  const bookingTime=b=>String(b.scheduled_time||b.preferred_time||'').slice(0,5);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderAcceptedToday(){
    if(typeof state==='undefined'||!get('h2book')||!get('h2TodayList'))return;
    const today=saToday();
    const rows=(state.bookings||[])
      .filter(b=>b.status==='accepted'&&bookingDate(b)===today)
      .sort((a,b)=>bookingTime(a).localeCompare(bookingTime(b)));

    get('h2book').textContent=rows.length;
    get('h2TodayList').innerHTML=rows.length
      ? rows.slice(0,5).map(b=>`<button class="h2-row" data-book="${esc(b.id)}"><span><b>${esc(bookingTime(b))} — ${esc(b.customer_name)}</b><small>${esc(b.customer_phone)} · ${esc(b.location_label||'')}</small></span>‹</button>`).join('')
      : '<div class="h2-empty">لا توجد مواعيد مقبولة اليوم.</div>';
  }

  function boot(){
    renderAcceptedToday();
    setInterval(()=>{if(document.visibilityState==='visible')renderAcceptedToday()},30000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(renderAcceptedToday,100)});
    const refresh=get('h2Refresh');
    if(refresh)refresh.addEventListener('click',()=>setTimeout(renderAcceptedToday,400));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250));
  else setTimeout(boot,250);
})();
