'use strict';
(()=>{
 const STORAGE_KEY='hulull_customer_booking_last';
 const edit={active:false,id:null,authPhone:null,originalDate:null,facadePath:null};
 window.HulullBookingEditState=edit;
 const byId=id=>document.getElementById(id);
 const isPublic=()=>new URLSearchParams(location.search).get('booking')==='1';
 const saved=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
 const saveCred=(id,phone)=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({id,phone,at:Date.now()}))}catch{}};
 const shortRef=id=>'REQ-'+String(id||'').slice(0,8).toUpperCase();

 function toast(title,message,type){
   if(typeof showToast==='function')showToast(title,message,type);
   else alert(title+'\n'+message);
 }
 function errorText(error){
   const m=String(error?.message||error||'');
   if(/BOOKING_EDIT_NOT_FOUND/.test(m))return 'تعذر التحقق من الطلب على هذا الجهاز.';
   if(/BOOKING_EDIT_LOCKED/.test(m))return 'تمت مراجعة الطلب أو قبوله، لذلك تم إيقاف التعديل لحماية بيانات الموعد.';
   if(/BOOKING_DAY_FULL/.test(m))return 'اكتمل العدد لهذا اليوم (٦ عملاء). اختر يوماً آخر.';
   if(/BOOKING_DATE_CLOSED/.test(m))return 'هذا اليوم غير متاح. اختر يوماً آخر غير الجمعة.';
   if(/BOOKING_EDIT_LOCATION/.test(m))return 'حدد موقع المنزل من الخريطة قبل الحفظ.';
   if(/BOOKING_EDIT_PHONE/.test(m))return 'تحقق من رقم الجوال.';
   if(/BOOKING_EDIT_NAME/.test(m))return 'تحقق من الاسم الكامل.';
   return 'تعذر حفظ التعديل. حاول مرة أخرى.';
 }

 function injectStyles(){
   if(byId('customerEditStyles'))return;
   const s=document.createElement('style');s.id='customerEditStyles';s.media='screen';s.textContent=`
   .booking-edit-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px}
   .booking-edit-btn{background:linear-gradient(135deg,#145b91,#1f7ab8)!important;color:#fff!important;border:0!important}
   .booking-edit-return{margin:0 0 18px;padding:14px 16px;border:1px solid #dbe7f1;border-radius:14px;background:#f8fbfe;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
   .booking-edit-return div{display:grid;gap:3px}.booking-edit-return b{font:800 .8rem 'Noto Kufi Arabic',sans-serif;color:#0f172a}.booking-edit-return span{font-size:.84rem;color:#64748b}
   .booking-edit-banner{display:none;margin:0 0 16px;padding:13px 14px;border:1px solid #bfdbfe;border-radius:13px;background:#eff6ff;color:#1e3a8a;font:700 .73rem 'Noto Kufi Arabic',sans-serif;line-height:1.9}
   .booking-edit-banner.show{display:flex;align-items:center;gap:9px}
   .booking-edit-banner i{font-size:1rem}
   @media(max-width:640px){.booking-edit-return{align-items:stretch}.booking-edit-return .btn{width:100%}.booking-edit-actions .btn{width:100%}}
   `;document.head.appendChild(s);
 }

 function installUI(){
   const success=byId('bookingSuccessPanel'),form=byId('customerBookingForm'),formPanel=byId('bookingFormPanel');
   if(!success||!form||!formPanel)return false;
   injectStyles();

   if(!byId('bookingEditBanner')){
     const banner=document.createElement('div');banner.id='bookingEditBanner';banner.className='booking-edit-banner';banner.innerHTML='<i class="fa-solid fa-pen-to-square"></i><span>أنت الآن تعدّل طلبك السابق. لن يتم إنشاء طلب جديد، وسيبقى رقم الطلب نفسه.</span>';
     form.prepend(banner);
   }

   if(!byId('editLastBookingBtn')){
     const actions=document.createElement('div');actions.className='booking-edit-actions';
     const btn=document.createElement('button');btn.id='editLastBookingBtn';btn.type='button';btn.className='btn booking-edit-btn hidden';btn.innerHTML='<i class="fa-solid fa-pen-to-square"></i> تعديل بيانات الطلب';btn.addEventListener('click',loadSavedBooking);
     const newBtn=byId('newBookingBtn');
     if(newBtn){newBtn.parentNode.insertBefore(actions,newBtn);actions.append(btn,newBtn)}else{actions.append(btn);success.append(actions)}
   }

   if(!byId('bookingEditReturn')){
     const box=document.createElement('div');box.id='bookingEditReturn';box.className='booking-edit-return hidden';
     box.innerHTML='<div><b>لديك طلب سابق</b><span>يمكنك تعديل طلبك السابق</span></div><button id="editSavedBookingBtn" class="btn btn-outline" type="button"><i class="fa-solid fa-pen"></i> تعديل الطلب السابق</button>';
     formPanel.insertBefore(box,form);byId('editSavedBookingBtn').addEventListener('click',loadSavedBooking);
   }

   form.addEventListener('submit',handleEditSubmit,true);
   byId('newBookingBtn')?.addEventListener('click',()=>exitEditMode(false));
   const observer=new MutationObserver(refreshButtons);observer.observe(success,{attributes:true,attributeFilter:['class']});
   refreshButtons();
   return true;
 }

 function refreshButtons(){
   const cred=saved(),success=byId('bookingSuccessPanel'),btn=byId('editLastBookingBtn'),box=byId('bookingEditReturn');
   if(btn)btn.classList.toggle('hidden',!cred||success?.classList.contains('hidden'));
   if(box)box.classList.toggle('hidden',!cred||edit.active||!success?.classList.contains('hidden'));
 }

 async function loadSavedBooking(){
   const cred=saved();
   if(!cred?.id||!cred?.phone){toast('لا يوجد طلب محفوظ','أرسل طلباً أولاً من هذا الجهاز.','error');return}
   const btn=byId('editLastBookingBtn')||byId('editSavedBookingBtn');if(btn)btn.disabled=true;
   try{
     const {data,error}=await state.client.rpc('customer_booking_edit_get',{p_booking_id:cred.id,p_phone:cred.phone});
     if(error)throw error;
     if(!data?.editable){toast('تم إغلاق التعديل','الطلب أصبح تحت المراجعة أو تم قبوله، ولا يمكن تعديل بياناته الآن.','error');return}
     beginEdit(data,cred.phone);
   }catch(error){console.error('Booking edit load error:',error);toast('تعذر فتح الطلب',errorText(error),'error')}
   finally{if(btn)btn.disabled=false}
 }

 async function beginEdit(data,authPhone){
   edit.active=true;edit.id=data.id;edit.authPhone=authPhone;edit.originalDate=data.preferred_date;edit.facadePath=data.facade_image_path;
   byId('bookingSuccessPanel')?.classList.add('hidden');byId('bookingFormPanel')?.classList.remove('hidden');
   byId('bookingEditBanner')?.classList.add('show');
   const file=byId('customerFacadeImage');if(file){file.required=false;file.value=''}
   byId('customerBookingName').value=data.customer_name||'';
   byId('customerBookingPhone').value=data.customer_phone||'';
   byId('customerPreferredDate').value=data.preferred_date||'';
   byId('customerBookingNotes').value=data.customer_notes||'';
   byId('customerLocationLabel').value=data.location_label||'';
   if(typeof setCustomerBookingLocation==='function')setCustomerBookingLocation(Number(data.location_lat),Number(data.location_lng),true);
   else{byId('customerLocationLat').value=data.location_lat??'';byId('customerLocationLng').value=data.location_lng??''}
   if(typeof loadBookingAvailability==='function')await loadBookingAvailability();
   byId('customerPreferredDate').value=data.preferred_date||'';
   if(typeof renderBookingCalendar==='function')renderBookingCalendar();
   if(typeof renderBookingTimes==='function')renderBookingTimes();
   const submit=byId('customerBookingSubmitBtn');if(submit){submit.disabled=false;submit.innerHTML='<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات'}
   refreshButtons();window.scrollTo({top:0,behavior:'smooth'});
 }

 function exitEditMode(showSuccess=true){
   edit.active=false;edit.id=null;edit.authPhone=null;edit.originalDate=null;edit.facadePath=null;
   byId('bookingEditBanner')?.classList.remove('show');
   const file=byId('customerFacadeImage');if(file)file.required=true;
   const submit=byId('customerBookingSubmitBtn');if(submit)submit.innerHTML='<i class="fa-solid fa-calendar-check"></i> إرسال طلب الحجز';
   if(showSuccess){byId('bookingFormPanel')?.classList.add('hidden');byId('bookingSuccessPanel')?.classList.remove('hidden')}
   refreshButtons();
 }

 async function uploadEditedFacade(file){
   if(!file)return null;
   if(!/^image\//i.test(file.type||''))throw new Error('BOOKING_EDIT_IMAGE');
   if(file.size>12*1024*1024)throw new Error('BOOKING_EDIT_IMAGE');
   const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'jpg';
   const path=`requests/${edit.id}/edit-${Date.now()}.${ext}`;
   const {error}=await state.client.storage.from('booking-facades').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||'image/jpeg'});
   if(error)throw error;return path;
 }

 async function handleEditSubmit(event){
   if(!edit.active)return;
   event.preventDefault();event.stopImmediatePropagation();
   const form=byId('customerBookingForm');if(!form?.reportValidity())return;
   const date=byId('customerPreferredDate').value;
   const lat=Number(byId('customerLocationLat').value),lng=Number(byId('customerLocationLng').value);
   if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('حدد الموقع','حدد موقع المنزل من الخريطة قبل الحفظ.','error');return}
   const submit=byId('customerBookingSubmitBtn');if(submit){submit.disabled=true;submit.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ التعديلات...'}
   try{
     if(date!==edit.originalDate && typeof assertBookingAvailability==='function')await assertBookingAvailability(date,null);
     const newFile=byId('customerFacadeImage').files?.[0]||null;
     const newPath=await uploadEditedFacade(newFile);
     const newPhone=byId('customerBookingPhone').value.trim();
     const {data,error}=await state.client.rpc('customer_booking_edit_update',{
       p_booking_id:edit.id,
       p_phone:edit.authPhone,
       p_customer_name:byId('customerBookingName').value.trim(),
       p_customer_phone:newPhone,
       p_preferred_date:date,
       p_location_lat:lat,
       p_location_lng:lng,
       p_location_label:byId('customerLocationLabel').value.trim()||null,
       p_customer_notes:byId('customerBookingNotes').value.trim()||null,
       p_facade_image_path:newPath
     });
     if(error)throw error;
     saveCred(edit.id,newPhone);edit.authPhone=newPhone;edit.originalDate=data?.preferred_date||date;edit.facadePath=data?.facade_image_path||newPath||edit.facadePath;
     byId('bookingReference').textContent=shortRef(edit.id);
     exitEditMode(true);
     toast('تم تحديث طلبك','تم حفظ التعديلات بنجاح مع الاحتفاظ بنفس رقم الطلب.');
   }catch(error){console.error('Booking edit save error:',error);toast('تعذر حفظ التعديل',errorText(error),'error');if(submit)submit.disabled=false}
   finally{if(edit.active&&submit)submit.innerHTML='<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات'}
 }

 function boot(){if(!isPublic())return;let tries=0;const timer=setInterval(()=>{tries++;if(installUI()||tries>60)clearInterval(timer)},150)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
