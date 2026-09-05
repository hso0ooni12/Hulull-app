// إعداد الربط السحابي — لا تضع أي Secret Key هنا.
window.APP_CONFIG = {
  SUPABASE_URL: 'https://mhplfjotafuudaduwjfo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_c5x6A7oaB3TWaTyMVYo_yg_PAwSSJZn'
};

// تحميل إضافات التقارير والحجز قبل كود التطبيق الرئيسي مع الإبقاء على index.html والطباعة كما هما.
document.write('<link rel="stylesheet" href="reports.css">');
document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\\/script>');
document.write('<script src="analytics.js"><\\/script>');
document.write('<script src="booking-rules.js"><\\/script>');
document.write('<script src="free-booking-map.js"><\\/script>');
document.write('<script src="excel-export.js"><\\/script>');
document.write('<script src="upgrade-init.js"><\\/script>');
