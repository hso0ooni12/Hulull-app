// إعداد الربط السحابي — لا تضع أي Secret Key هنا.
window.APP_CONFIG = {
  SUPABASE_URL: 'https://mhplfjotafuudaduwjfo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_c5x6A7oaB3TWaTyMVYo_yg_PAwSSJZn'
};

// تحميل إضافات التقارير والحجز والتطويرات بدون تغيير بيانات السندات الحالية.
const hulullScript = src => document.write('<script src="'+src+'"></'+'script>');
document.write('<link rel="stylesheet" href="reports.css">');
document.write('<link rel="stylesheet" href="hulull-v2.css">');
hulullScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
hulullScript('analytics.js');
hulullScript('booking-rules.js');
hulullScript('free-booking-map.js');
hulullScript('excel-export.js');
hulullScript('upgrade-init.js');
hulullScript('hulull-v2.js');
hulullScript('field-complete.js');
hulullScript('signed-status.js');
