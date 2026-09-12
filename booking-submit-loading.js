'use strict';
(()=>{
 const byId=id=>document.getElementById(id);
 let active=false,timer=null,startedAt=0,seenDisabled=false,originalButtonHTML='';

 function inject(){
  if(byId('bookingSubmitLoadingStyles'))return;
  const style=document.createElement('style');
  style.id='bookingSubmitLoadingStyles';
  style.media='screen';
  style.textContent=`
  .booking-submit-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.42);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
  .booking-submit-overlay.show{display:flex}
  .booking-submit-card{width:min(92vw,390px);background:#fff;border:1px solid #dbe7f1;border-radius:24px;padding:28px 24px 24px;box-shadow:0 28px 80px rgba(15,23,42,.24);text-align:center;direction:rtl}
  .booking-submit-spinner{width:62px;height:62px;margin:0 auto 18px;border-radius:50%;border:5px solid #e6eef5;border-top-color:#1f7ab8;animation:bookingSpin .85s linear infinite}
  .booking-submit-card h3{margin:0 0 8px;color:#0f172a;font:800 1rem 'Noto Kufi Arabic',sans-serif}
  .booking-submit-card p{margin:0;color:#64748b;font-size:.94rem;line-height:1.9}
  .booking-submit-progress{height:6px;margin-top:20px;border-radius:999px;background:#e8eef4;overflow:hidden;position:relative}
  .booking-submit-progress:after{content:"";position:absolute;top:0;bottom:0;width:42%;border-radius:999px;background:linear-gradient(90deg,#145b91,#38a6d8);animation:bookingProgress 1.25s ease-in-out infinite}
  .booking-submit-note{display:block;margin-top:13px;color:#94a3b8;font:600 .68rem 'Noto Kufi Arabic',sans-serif}
  @keyframes bookingSpin{to{transform:rotate(360deg)}}
  @keyframes bookingProgress{0%{right:-42%}100%{right:100%}}
  @media(max-width:640px){.booking-submit-card{border-radius:20px;padding:25px 20px 22px}}
  `;
  document.head.appendChild(style);

  const overlay=document.createElement('div');
  overlay.id='bookingSubmitOverlay';
  overlay.className='booking-submit-overlay';
  overlay.setAttribute('role','status');
  overlay.setAttribute('aria-live','polite');
  overlay.setAttribute('aria-busy','true');
  overlay.innerHTML=`<div class="booking-submit-card"><div class="booking-submit-spinner" aria-hidden="true"></div><h3 id="bookingSubmitLoadingTitle">جاري إرسال طلبك...</h3><p id="bookingSubmitLoadingText">يتم الآن رفع صورة الواجهة وحفظ بيانات الطلب، يرجى الانتظار قليلًا.</p><div class="booking-submit-progress" aria-hidden="true"></div><span class="booking-submit-note">لا تغلق الصفحة حتى تكتمل العملية</span></div>`;
  document.body.appendChild(overlay);
 }

 function show(){
  if(active)return;
  inject();active=true;startedAt=Date.now();seenDisabled=false;
  const editing=!!window.HulullBookingEditState?.active;
  const title=byId('bookingSubmitLoadingTitle'),text=byId('bookingSubmitLoadingText');
  if(title)title.textContent=editing?'جاري حفظ التعديلات...':'جاري إرسال طلبك...';
  if(text)text.textContent=editing?'يتم الآن تحديث بيانات طلبك، يرجى الانتظار قليلًا.':'يتم الآن رفع صورة الواجهة وحفظ بيانات الطلب، يرجى الانتظار قليلًا.';
  byId('bookingSubmitOverlay')?.classList.add('show');
  document.documentElement.style.overflow='hidden';
  const btn=byId('customerBookingSubmitBtn');
  if(btn){originalButtonHTML=btn.innerHTML;btn.setAttribute('aria-busy','true');btn.innerHTML=`<i class="fa-solid fa-spinner fa-spin"></i> ${editing?'جاري الحفظ...':'جاري إرسال الطلب...'}`}
  clearInterval(timer);timer=setInterval(watch,180);
 }

 function hide(){
  if(!active)return;
  active=false;clearInterval(timer);timer=null;
  byId('bookingSubmitOverlay')?.classList.remove('show');
  document.documentElement.style.overflow='';
  const btn=byId('customerBookingSubmitBtn');
  if(btn){btn.removeAttribute('aria-busy');if(originalButtonHTML&&byId('bookingSuccessPanel')?.classList.contains('hidden'))btn.innerHTML=originalButtonHTML}
 }

 function watch(){
  const success=byId('bookingSuccessPanel');
  const btn=byId('customerBookingSubmitBtn');
  if(success&&!success.classList.contains('hidden')){setTimeout(hide,220);return}
  if(btn?.disabled)seenDisabled=true;
  if(seenDisabled&&btn&&!btn.disabled&&Date.now()-startedAt>700){hide();return}
  if(Date.now()-startedAt>60000)hide();
 }

 function install(){
  const form=byId('customerBookingForm');if(!form||form.__hulullLoadingInstalled)return false;
  form.addEventListener('submit',()=>{
    if(form.checkValidity())setTimeout(show,0);
  },true);
  form.__hulullLoadingInstalled=true;
  return true;
 }

 function boot(){
  if(new URLSearchParams(location.search).get('booking')!=='1')return;
  inject();let tries=0;const t=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(t)},100);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
