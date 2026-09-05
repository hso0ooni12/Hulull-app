'use strict';
(function(){
 function reportMarkup(){return `
<section class="financial-reports" aria-label="التقارير المالية">
  <div class="card" style="margin-bottom:16px"><div class="card-header"><h3 class="card-title">تحليل حركة السندات</h3><button class="btn btn-success" id="excel-dashboard" type="button">تصدير الفترة Excel</button></div><div class="card-body"><div class="report-controls"><div class="field"><label for="reportPreset">الفترة</label><select id="reportPreset" class="input"><option value="month">الشهر الحالي حتى اليوم</option><option value="today">اليوم</option><option value="year">السنة الحالية حتى اليوم</option><option value="all">جميع السندات</option><option value="custom">فترة مخصصة</option></select></div><div id="reportCustomDates" class="report-controls hidden"><div class="field"><label for="reportFrom">من</label><input id="reportFrom" class="input" type="date"></div><div class="field"><label for="reportTo">إلى</label><input id="reportTo" class="input" type="date"></div><button id="reportApply" class="btn btn-primary" type="button">عرض</button></div></div><p id="reportError" role="alert" style="color:#b91c1c"></p><p id="reportRangeLabel" class="report-note"></p><p id="reportComparison" class="report-note"></p><p class="report-note">صافي الحركة = القبض − الصرف المسجل. لا يمثل الأرباح أو الرصيد البنكي؛ لا يتضمن رصيدًا افتتاحيًا أو مبالغ مستحقة غير مسجلة.</p></div></div>
  <div class="report-metrics"><article class="summary-card"><div class="summary-label">قبض الفترة</div><div id="periodIn" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">صرف الفترة</div><div id="periodOut" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">صافي حركة الفترة</div><div id="periodNet" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">عدد سندات الفترة</div><div id="periodCount" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">متوسط القبض اليومي</div><div id="dailyIn" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">متوسط الصرف اليومي</div><div id="dailyOut" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">عدد الجهات الدافعة</div><div id="periodPartiesIn" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">عدد الجهات المستفيدة</div><div id="periodPartiesOut" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">أيام بها حركة</div><div id="periodActiveDays" class="summary-value">—</div></article><article class="summary-card"><div class="summary-label">الصرف كنسبة من القبض</div><div id="periodOutRatio" class="summary-value">—</div></article></div>
  <div class="report-tables"><section class="card"><div class="card-header"><h3 class="card-title">التوزيع الشهري للفترة</h3></div><div class="table-wrap"><table><thead><tr><th>الفترة / البند</th><th>القبض</th><th>الصرف</th><th>الصافي</th><th>عدد السندات</th></tr></thead><tbody id="reportMonths"></tbody></table></div></section><section class="card"><div class="card-header"><h3 class="card-title">الحركة حسب طريقة الدفع</h3></div><div class="table-wrap"><table><thead><tr><th>الفترة / البند</th><th>القبض</th><th>الصرف</th><th>الصافي</th><th>عدد السندات</th></tr></thead><tbody id="reportPayments"></tbody></table></div></section><section class="card"><div class="card-header"><h3 class="card-title">أعلى 5 جهات في القبض</h3></div><div class="table-wrap"><table><thead><tr><th>الطرف</th><th>إجمالي القبض</th></tr></thead><tbody id="reportTopIn"></tbody></table></div></section><section class="card"><div class="card-header"><h3 class="card-title">أعلى 5 جهات في الصرف</h3></div><div class="table-wrap"><table><thead><tr><th>الطرف</th><th>إجمالي الصرف</th></tr></thead><tbody id="reportTopOut"></tbody></table></div></section></div>
  <div class="card" style="margin:16px 0"><div class="card-header"><h3 class="card-title">متابعة التشغيل</h3></div><div class="card-body"><div class="mini-stats"><div class="mini-stat"><span>طلبات بانتظار المراجعة</span><b id="opsPending">—</b></div><div class="mini-stat"><span>مهام اليوم غير المنجزة</span><b id="opsToday">—</b></div><div class="mini-stat"><span>مهام سابقة غير منجزة</span><b id="opsOverdue">—</b></div><div class="mini-stat"><span>نسبة إنجاز مهام الفترة</span><b id="opsCompletion">—</b></div></div></div></div>
</section>`}
 function installBookingUI(){
  const date=document.getElementById('customerPreferredDate'),time=document.getElementById('customerPreferredTime');if(!date||!time)return false;
  if(!document.getElementById('bookingCalendarDays')) date.parentElement.innerHTML='<label for="customerPreferredDate">التاريخ المفضل *</label><input id="customerPreferredDate" type="hidden"><div class="booking-calendar"><div class="booking-calendar-nav"><button id="bookingMonthPrev" class="btn btn-soft" type="button">السابق</button><b id="bookingMonthLabel">جاري تحميل التقويم...</b><button id="bookingMonthNext" class="btn btn-soft" type="button">التالي</button></div><div class="booking-weekdays"><span>س</span><span>أ</span><span>إ</span><span>ث</span><span>أر</span><span>خ</span><span>ج</span></div><div id="bookingCalendarDays" class="booking-calendar-days"></div><p id="bookingSelectedDate">جاري تحميل الأيام المتاحة...</p></div>';
  const currentTime=document.getElementById('customerPreferredTime');
  if(currentTime&&currentTime.tagName!=='SELECT') currentTime.parentElement.innerHTML='<label for="customerPreferredTime">الوقت المفضل *</label><select id="customerPreferredTime" class="input" required disabled><option value="">اختر اليوم أولاً</option></select><p id="bookingAvailabilityMessage" role="status" aria-live="polite">جاري تحميل المواعيد...</p><button id="bookingAvailabilityRetry" class="btn btn-soft hidden" type="button">تحديث المواعيد</button>';
  return true;
 }
 function startBookingCalendarWhenReady(){
  if(!document.getElementById('bookingCalendarDays'))return;
  let tries=0;
  const boot=()=>{
   tries++;
   try{
    if(typeof state!=='undefined'&&state.client&&typeof initializeBookingCalendar==='function'){
     initializeBookingCalendar();
     return;
    }
   }catch(e){console.warn('Booking calendar init:',e)}
   if(tries<80)setTimeout(boot,100);
   else{
    const label=document.getElementById('bookingMonthLabel'),msg=document.getElementById('bookingSelectedDate');
    if(label)label.textContent='تعذر تحميل التقويم';
    if(msg)msg.textContent='حدّث الصفحة وحاول مرة أخرى.';
   }
  };
  setTimeout(boot,0);
 }
 function addExcelButton(scope,anchorId,label){if(document.getElementById('excel-'+scope))return;const anchor=document.getElementById(anchorId);if(!anchor)return;const b=document.createElement('button');b.id='excel-'+scope;b.type='button';b.className='btn btn-success';b.textContent=label;anchor.parentElement.insertBefore(b,anchor.nextSibling)}
 document.addEventListener('DOMContentLoaded',()=>{
  installBookingUI();
  startBookingCalendarWhenReady();
  const dashboard=document.getElementById('page-dashboard');if(dashboard&&!document.getElementById('reportPreset')){const summary=dashboard.querySelector('.summary-grid');if(summary)summary.insertAdjacentHTML('afterend',reportMarkup())}
  addExcelButton('incoming','incomingShown','تصدير النتائج Excel');addExcelButton('outgoing','outgoingShown','تصدير النتائج Excel');addExcelButton('all','exportBtn','تصدير جميع السندات Excel');
  if(window.HulullFreeBookingMap)window.initCustomerBookingMap=window.HulullFreeBookingMap;
  if(typeof renderDashboard==='function'){const originalDashboard=renderDashboard;window.renderDashboard=function(){const result=originalDashboard.apply(this,arguments);renderFinancialReports();return result}}
  try{bindReports()}catch(e){console.warn('Reports init:',e)}
 });
})();
