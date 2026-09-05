'use strict';
function bookingValidISODate(value){
 const text=String(value||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;
 const d=new Date(text+'T12:00:00Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===text;
}
const BookingRules={
 times:Array.from({length:8},(_,i)=>String(i+9).padStart(2,'0')+':00'),
 today(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)},
 addDays(iso,n){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)},
 allowed(date,today=this.today()){return bookingValidISODate(date)&&date>today&&new Date(date+'T12:00:00Z').getUTCDay()!==5},
 validate(date,time,today=this.today()){if(!this.allowed(date,today))throw new Error('الحجز من اليوم التالي فقط، والجمعة إجازة.');if(!this.times.includes(String(time).slice(0,5))||!/^\d{2}:00(?::00)?$/.test(time))throw new Error('اختر موعداً متاحاً من ٩ صباحاً إلى ٤ عصراً.');}
};
const BookingCalendar={month:null,days:[],request:0,timer:null,today:null,loading:false};
function bookingError(error){
 const m=String(error?.message||error||'');
 if(/BOOKING_SLOT_TAKEN/.test(m))return 'هذا الوقت غير متاح؛ حجزه عميل آخر. اختر وقتاً آخر.';
 if(/BOOKING_DAY_FULL/.test(m))return 'اكتمل العدد لهذا اليوم (٦ عملاء). اختر يوماً آخر.';
 if(/BOOKING_DATE_CLOSED/.test(m))return 'هذا اليوم غير متاح. الحجز من بكرة والجمعة إجازة.';
 if(/BOOKING_TIME_CLOSED/.test(m))return 'اختر وقتاً متاحاً من ٩ صباحاً إلى ٤ عصراً.';
 if(/booking_availability|PGRST202|BOOKING_SETUP/.test(m))return 'الحجز غير متاح مؤقتاً. يرجى التواصل مع المؤسسة.';
 if(/BOOKING_/.test(m))return 'تعذر تثبيت الموعد. حدّث المواعيد ثم حاول مرة أخرى.';
 if(typeof friendlyBookingDbError==='function')return friendlyBookingDbError(error);
 return 'تعذر تحميل المواعيد. اضغط تحديث المواعيد وحاول مرة أخرى.';
}
function initializeBookingCalendar(){
 const tomorrow=BookingRules.addDays(BookingRules.today(),1);BookingCalendar.month=tomorrow.slice(0,7)+'-01';
 $('customerPreferredDate').value='';$('customerPreferredDate').min=tomorrow;
 $('bookingMonthPrev').onclick=()=>moveBookingMonth(-1);$('bookingMonthNext').onclick=()=>moveBookingMonth(1);
 $('bookingAvailabilityRetry').onclick=()=>loadBookingAvailability();
 $('customerPreferredTime').onchange=()=>{$('bookingAvailabilityMessage').textContent=$('customerPreferredTime').value?'الموعد متاح حاليًا؛ يُثبت عند إرسال الطلب.':'اختر وقتاً متاحاً.'};
 loadBookingAvailability();
 if(BookingCalendar.timer)clearInterval(BookingCalendar.timer);
 BookingCalendar.timer=setInterval(()=>{if(document.visibilityState==='visible'&&!state.bookingSubmitting)loadBookingAvailability()},30000);
}
function moveBookingMonth(delta){
 const d=new Date(BookingCalendar.month+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);
 const month=d.toISOString().slice(0,7)+'-01';if(month<BookingRules.today().slice(0,7)+'-01')return;
 BookingCalendar.month=month;$('customerPreferredDate').value='';loadBookingAvailability();
}
async function loadBookingAvailability(){
 const sequence=++BookingCalendar.request;BookingCalendar.loading=true;
 $('customerPreferredTime').disabled=true;$('customerBookingSubmitBtn').disabled=true;
 $('bookingCalendarDays').querySelectorAll('button').forEach(b=>b.disabled=true);
 $('bookingAvailabilityMessage').textContent='جاري تحديث المواعيد المتاحة...';$('bookingAvailabilityRetry').classList.add('hidden');
 const start=BookingCalendar.month,d=new Date(start+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);d.setUTCDate(0);const end=d.toISOString().slice(0,10);
 try{
  const {data,error}=await state.client.rpc('booking_availability',{p_from:start,p_to:end});if(error)throw error;
  if(sequence!==BookingCalendar.request)return false;
  if(!data||!Array.isArray(data.days)||!bookingValidISODate(data.today))throw new Error('BOOKING_SETUP');
  BookingCalendar.days=data.days;BookingCalendar.today=data.today;BookingCalendar.loading=false;
  renderBookingCalendar();renderBookingTimes();return true;
 }catch(error){
  if(sequence!==BookingCalendar.request)return false;
  BookingCalendar.days=[];BookingCalendar.loading=false;renderBookingCalendar();
  $('customerPreferredTime').replaceChildren();$('customerPreferredTime').disabled=true;$('customerBookingSubmitBtn').disabled=true;
  $('bookingAvailabilityMessage').textContent=bookingError(error);$('bookingAvailabilityRetry').classList.remove('hidden');return false;
 }
}
function renderBookingCalendar(){
 const grid=$('bookingCalendarDays');grid.replaceChildren();
 $('bookingMonthLabel').textContent=new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(BookingCalendar.month+'T12:00:00Z'));
 $('bookingMonthPrev').disabled=BookingCalendar.month<=(BookingCalendar.today||BookingRules.today()).slice(0,7)+'-01';
 const offset=(new Date(BookingCalendar.month+'T12:00:00Z').getUTCDay()+1)%7;
 for(let i=0;i<offset;i++){const spacer=document.createElement('span');grid.append(spacer)}
 for(const day of BookingCalendar.days){
  const button=document.createElement('button');button.type='button';button.className='booking-day';button.disabled=!day.available||BookingCalendar.loading;
  const label=day.available?'متاح':day.reason==='full'?'مكتمل':day.reason==='friday'?'إجازة':'غير متاح';
  button.textContent=Number(day.date.slice(8))+'\n'+label;button.setAttribute('aria-label',day.date+' '+label);button.setAttribute('aria-pressed',String(day.date===$('customerPreferredDate').value));
  button.onclick=()=>{$('customerPreferredDate').value=day.date;$('customerPreferredTime').value='';renderBookingCalendar();renderBookingTimes()};grid.append(button);
 }
}
function renderBookingTimes(){
 const date=$('customerPreferredDate').value,day=BookingCalendar.days.find(d=>d.date===date),select=$('customerPreferredTime'),previous=select.value;
 select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='اختر الوقت المتاح';select.append(placeholder);
 const formattedDate=typeof formatDate==='function'?formatDate(date):date;
 $('bookingSelectedDate').textContent=date?'اليوم المختار: '+formattedDate:'اختر يوماً متاحاً من التقويم';
 for(const time of BookingRules.times){const option=document.createElement('option');option.value=time;const hour=Number(time.slice(0,2));const free=!!day?.available&&!day.taken.includes(time);option.disabled=!free;option.textContent=`${hour>12?hour-12:hour}:00 ${hour<12?'صباحًا':'مساءً'}${free?'':' — غير متاح'}`;select.append(option)}
 const available=!!day?.available;select.disabled=!available||BookingCalendar.loading;
 if(available&&!day.taken.includes(previous)&&BookingRules.times.includes(previous))select.value=previous;
 $('customerBookingSubmitBtn').disabled=!available||BookingCalendar.loading||state.bookingSubmitting;
 $('bookingAvailabilityMessage').textContent=available?'اختر الوقت المتاح؛ يُثبت الموعد عند إرسال الطلب.':date?'اليوم غير متاح؛ اختر يوماً آخر.':'الحجز من بكرة، من ٩ صباحاً إلى ٤ عصراً. الجمعة إجازة.';
}
async function assertBookingAvailability(date,time){
 BookingRules.validate(date,time,BookingCalendar.today||BookingRules.today());
 const {data,error}=await state.client.rpc('booking_availability',{p_from:date,p_to:date});if(error)throw error;
 const day=data?.days?.[0];
 if(!day)throw new Error('BOOKING_SETUP');
 if(!day.available)throw new Error(day.reason==='full'?'BOOKING_DAY_FULL':'BOOKING_DATE_CLOSED');
 if(day.taken.includes(time.slice(0,5)))throw new Error('BOOKING_SLOT_TAKEN');
}
