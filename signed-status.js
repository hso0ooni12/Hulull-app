/* تصنيف: تم التوقيع — موافقة العميل على السعر وتوقيع العقد */
'use strict';
(function(){
  const SIGNED='signed';
  function addOption(select,beforeValue){
    if(!select||select.querySelector('option[value="signed"]'))return;
    const option=document.createElement('option');option.value=SIGNED;option.textContent='تم التوقيع ✅';
    const before=beforeValue?select.querySelector(`option[value="${beforeValue}"]`):null;
    if(before)select.insertBefore(option,before);else select.append(option);
  }
  function patchUI(){
    addOption(document.getElementById('bookingAdminStatus'),'completed');
    addOption(document.getElementById('bookingStatusFilter'),'completed');
    if(!document.getElementById('signedStatusStyle')){
      const style=document.createElement('style');style.id='signedStatusStyle';
      style.textContent='.booking-status.signed{background:#ecfdf3!important;color:#15803d!important;border-color:#bbf7d0!important;font-weight:800}.booking-status.signed::before{content:"✓ ";}';
      document.head.append(style);
    }
  }
  window.addEventListener('DOMContentLoaded',()=>{
    patchUI();
    try{
      if(typeof bookingStatusLabel==='function'){
        const original=bookingStatusLabel;
        bookingStatusLabel=function(status){return status===SIGNED?'تم التوقيع ✅':original(status)};
      }
    }catch(_e){}
    // بعد تعديل التصنيف، أعد الرسم حتى يظهر الاسم العربي في البطاقات.
    try{if(typeof renderBookings==='function')renderBookings()}catch(_e){}
  });
})();
