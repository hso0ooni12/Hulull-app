'use strict';
(()=>{
  if(!/field-v3\.html$/i.test(location.pathname)) return;
  const RPC_COMPLETE='https://mhplfjotafuudaduwjfo.supabase.co/rest/v1/rpc/field_complete_booking';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function completeRequest(id,name){
    const ok=confirm(`تأكيد إتمام المعاينة وأخذ المقاسات للعميل ${name||''}؟`);
    if(!ok)return;
    try{
      const key=window.APP_CONFIG?.SUPABASE_PUBLISHABLE_KEY;
      if(!key)throw new Error('NO_KEY');
      const r=await fetch(RPC_COMPLETE,{method:'POST',headers:{'Content-Type':'application/json','apikey':key},body:JSON.stringify({p_id:id,p_code:code})});
      const data=await r.json().catch(()=>false);
      if(!r.ok||data!==true)throw new Error('COMPLETE_FAILED');
      await load();
      alert('تم تسجيل أن المعاينة وأخذ المقاسات مكتملة.');
    }catch(e){
      alert('تعذر تحديث حالة الطلب. حاول مرة أخرى.');
    }
  }

  function decorate(){
    if(typeof rows==='undefined')return;
    document.querySelectorAll('#cards .card').forEach(card=>{
      const open=card.querySelector('[data-open]');
      if(!open)return;
      const id=open.getAttribute('data-open');
      const row=rows.find(r=>r.id===id);
      if(!row)return;
      card.classList.toggle('measurement-complete',row.status==='completed');
      let slot=card.querySelector('.measurement-action');
      if(!slot){slot=document.createElement('div');slot.className='measurement-action';card.appendChild(slot)}
      if(row.status==='completed'){
        slot.innerHTML='<div class="measurement-done"><i class="fa-solid fa-circle-check"></i><span><b>تمت المعاينة والتمتير</b><small>تم أخذ مقاسات العميل</small></span></div>';
      }else if(['accepted','scheduled'].includes(row.status)){
        slot.innerHTML='<button type="button" class="measurement-btn"><i class="fa-solid fa-ruler-combined"></i><span><b>تم أخذ المقاسات</b><small>اضغط بعد إكمال التمتير للعميل</small></span></button>';
        slot.querySelector('button').onclick=()=>completeRequest(row.id,row.customer_name);
      }else{
        slot.innerHTML='';
      }
    });
  }

  function installStyle(){
    if(document.getElementById('measurementStyle'))return;
    const s=document.createElement('style');s.id='measurementStyle';s.textContent=`
      .measurement-action{margin-top:12px}
      .measurement-btn,.measurement-done{width:100%;border-radius:14px;min-height:58px;padding:11px 14px;display:flex;align-items:center;gap:11px;text-align:right}
      .measurement-btn{border:1px solid #86efac;background:linear-gradient(135deg,#ecfdf3,#f0fdf4);color:#166534;cursor:pointer}
      .measurement-btn i,.measurement-done i{font-size:22px;flex:0 0 auto}
      .measurement-btn span,.measurement-done span{display:grid;gap:2px}
      .measurement-btn b,.measurement-done b{font-size:15px}.measurement-btn small,.measurement-done small{font-size:12px;font-weight:600;opacity:.78}
      .measurement-done{border:1px solid #22c55e;background:#166534;color:#fff}
      .measurement-complete{border-color:#86efac;background:#fbfffc}
      .status.completed{background:#166534;color:#fff}
    `;document.head.appendChild(s);
  }

  async function boot(){
    installStyle();
    for(let i=0;i<80;i++){
      if(typeof render==='function'&&typeof load==='function'&&typeof rows!=='undefined'){
        const originalRender=render;
        window.render=function(){const v=originalRender.apply(this,arguments);setTimeout(decorate,0);return v};
        try{statusText=(()=>{const old=statusText;return s=>s==='completed'?'تمت المعاينة والتمتير':old(s)})()}catch{}
        decorate();
        return;
      }
      await sleep(50);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();