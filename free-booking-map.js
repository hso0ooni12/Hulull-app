'use strict';
function initCustomerBookingMap(){
 if(customerBookingMap){customerBookingMap.invalidateSize();return}
 if(!window.L){$('customerLocationText').textContent='تعذر تحميل الخريطة. يمكنك استخدام زر تحديد موقعي أو إعادة تحميل الصفحة.';return}
 customerBookingMap=L.map('customerLocationMap',{zoomControl:true,scrollWheelZoom:false}).setView([24.7136,46.6753],11);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,updateWhenIdle:true,keepBuffer:1,referrerPolicy:'strict-origin-when-cross-origin',
  attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
 }).addTo(customerBookingMap);
 let notified=false;
 tiles.on('tileerror',()=>{if(!notified){notified=true;showToast('تعذر تحميل بعض أجزاء الخريطة','تحقق من الاتصال. يمكنك تحديد موقعك بالزر أعلى الخريطة.','error')}});
 customerBookingMap.on('click',event=>setCustomerBookingLocation(event.latlng.lat,event.latlng.lng,true));
 const lat=$('customerLocationLat').value,lng=$('customerLocationLng').value;
 if(lat&&lng)setCustomerBookingLocation(Number(lat),Number(lng),true);
 setTimeout(()=>customerBookingMap.invalidateSize(),100);
}
function setCustomerBookingLocation(lat,lng,center=false){
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)return;
 const preciseLat=lat.toFixed(6),preciseLng=lng.toFixed(6);
 $('customerLocationLat').value=preciseLat;$('customerLocationLng').value=preciseLng;
 $('customerLocationText').textContent=`تم تحديد الموقع: ${preciseLat}, ${preciseLng} — اسحب العلامة لتعديل الموقع`;
 if(!customerBookingMap)return;
 if(!customerBookingMarker){
  const icon=L.divIcon({className:'hulull-map-pin',html:'<span aria-hidden="true"></span>',iconSize:[32,40],iconAnchor:[16,38]});
  customerBookingMarker=L.marker([lat,lng],{draggable:true,icon,title:'موقع المنزل — اسحب لتعديل الموقع',autoPan:true}).addTo(customerBookingMap);
  customerBookingMarker.on('dragend',event=>{const p=event.target.getLatLng();setCustomerBookingLocation(p.lat,p.lng)});
 }else customerBookingMarker.setLatLng([lat,lng]);
 if(center)customerBookingMap.setView([lat,lng],17);
}
window.HulullFreeBookingMap=initCustomerBookingMap;

// Hulull 2.0 dashboard correction: today's list contains accepted bookings only.
(()=>{
 const byId=id=>document.getElementById(id);
 const todaySA=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const dateOf=b=>b.scheduled_date||b.preferred_date||'';
 const timeOf=b=>String(b.scheduled_time||b.preferred_time||'').slice(0,5);
 const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
 function renderAcceptedToday(){
  if(typeof state==='undefined'||!byId('h2book')||!byId('h2TodayList'))return;
  const today=todaySA();
  const rows=(state.bookings||[]).filter(b=>b.status==='accepted'&&dateOf(b)===today).sort((a,b)=>timeOf(a).localeCompare(timeOf(b)));
  byId('h2book').textContent=rows.length;
  byId('h2TodayList').innerHTML=rows.length?rows.slice(0,5).map(b=>`<button class="h2-row" data-book="${clean(b.id)}"><span><b>${clean(timeOf(b))} — ${clean(b.customer_name)}</b><small>${clean(b.customer_phone)} · ${clean(b.location_label||'')}</small></span>‹</button>`).join(''):'<div class="h2-empty">لا توجد مواعيد مقبولة اليوم.</div>';
 }
 function boot(){
  let tries=0;
  const start=()=>{tries++;renderAcceptedToday();if(!byId('h2Today')&&tries<40)setTimeout(start,250)};
  start();
  setInterval(()=>{if(document.visibilityState==='visible')renderAcceptedToday()},30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(renderAcceptedToday,150)});
  document.addEventListener('click',e=>{if(e.target.closest?.('#h2Refresh'))setTimeout(renderAcceptedToday,500)});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,300));else setTimeout(boot,300);
})();

// Quick access to the field employee page from the customer bookings screen.
(()=>{
 const BUTTON_ID='openFieldFollowUpBtn';
 function addFollowUpButton(){
  if(document.getElementById(BUTTON_ID))return true;
  const page=document.getElementById('page-bookings');
  if(!page)return false;
  const controls=[...page.querySelectorAll('button,a')];
  const anchor=controls.find(el=>/فتح صفحة العملاء/.test(el.textContent||''))||controls.find(el=>/نسخ رابط الحجز/.test(el.textContent||''));
  if(!anchor||!anchor.parentElement)return false;
  const btn=document.createElement('a');
  btn.id=BUTTON_ID;
  btn.href='field.html?v=5';
  btn.target='_blank';
  btn.rel='noopener';
  btn.className=anchor.className||'btn btn-primary';
  btn.innerHTML='<i class="fa-solid fa-list-check"></i> متابعة الطلبات';
  btn.style.textDecoration='none';
  btn.style.display='inline-flex';
  btn.style.alignItems='center';
  btn.style.justifyContent='center';
  btn.style.gap='8px';
  anchor.parentElement.appendChild(btn);
  return true;
 }
 function boot(){
  let tries=0;
  const timer=setInterval(()=>{tries++;if(addFollowUpButton()||tries>60)clearInterval(timer)},250);
  const observer=new MutationObserver(()=>addFollowUpButton());
  observer.observe(document.body,{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
