// إعداد الربط السحابي — لا تضع أي Secret Key هنا.
window.APP_CONFIG = {
  SUPABASE_URL: 'https://mhplfjotafuudaduwjfo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_c5x6A7oaB3TWaTyMVYo_yg_PAwSSJZn'
};

// رابط صفحة الموظف الرسمي الوحيد هو field.html.
if(window.top===window.self && /\/field-v3(?:\.html)?$/i.test(location.pathname)){
  location.replace('field.html');
}

// صفحة الحجز العامة يجب أن تبقى معزولة بالكامل عن إضافات الإدارة.
const HULULL_PUBLIC_BOOKING = new URLSearchParams(location.search).get('booking') === '1';

// تحميل إضافات التقارير والحجز والتطويرات بدون تغيير بيانات السندات الحالية.
const hulullScript = src => document.write('<script src="'+src+'"></'+'script>');
document.write('<link rel="stylesheet" href="reports.css">');
if(!HULULL_PUBLIC_BOOKING){
  document.write('<link rel="stylesheet" href="hulull-v2.css">');
}
// V4: طبقة تصميم للشاشة فقط. لا تغيّر أي CSS خاص بالطباعة.
document.write('<link rel="stylesheet" media="screen" href="hulull-v4-theme.css?v=3">');
// حماية العزل بين صفحة الحجز العامة ولوحة التحكم، خصوصًا على الجوال.
document.write('<style media="screen">.hidden{display:none!important}@media(max-width:900px){.app-shell.hidden{display:none!important}.auth-shell.hidden,.config-shell.hidden,.booking-public-shell.hidden{display:none!important}}'+(HULULL_PUBLIC_BOOKING?'#h2Mobile,.h2-mobile,.mobile-bottom-nav,.hulull-mobile-nav,.sidebar,.topbar{display:none!important}body{padding-bottom:0!important}':'')+'</style>');
hulullScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
hulullScript('analytics.js');
// الحجز باليوم فقط + دعم تعديل العميل لطلبه ما دام Pending.
hulullScript('booking-rules.js?v=20260912-2');
hulullScript('free-booking-map.js');
if(HULULL_PUBLIC_BOOKING){
  hulullScript('booking-customer-edit.js?v=20260912-1');
  // إظهار حالة واضحة أثناء رفع صورة الواجهة وحفظ طلب العميل.
  hulullScript('booking-submit-loading.js?v=20260912-2');
}
hulullScript('excel-export.js');
hulullScript('upgrade-init.js');
if(!HULULL_PUBLIC_BOOKING){
  hulullScript('hulull-v2.js');
  hulullScript('field-complete.js');
  hulullScript('signed-status.js');
}
