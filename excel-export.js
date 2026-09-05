/* Browser-side XLSX export. OOXML parts follow Microsoft SpreadsheetML.
   Packaging only: JSZip 3.x (vendored, MIT license in vendor/JSZip-LICENSE.md).
   No financial data is sent to a spreadsheet service. */
'use strict';
const HulullExcel=(()=>{
 const excelValidISODate=value=>{const text=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;const d=new Date(text+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===text};
 const esc=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').slice(0,32767).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const dateNumber=iso=>(Date.parse(iso+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;
 const col=n=>{let text='';for(n++;n;n=Math.floor((n-1)/26))text=String.fromCharCode(65+(n-1)%26)+text;return text};
 const number=(v,s=2)=>({value:v,style:s});
 const formula=(f,v,s=2)=>({formula:f,value:v,style:s});
 function sheetXML(rows,widths,filter=false){
  const end=col(Math.max(...rows.map(r=>r.length))-1)+rows.length;
  const data=rows.map((row,r)=>`<row r="${r+1}"${r===0?' ht="32" customHeight="1"':''}>${row.map((raw,c)=>{
   const cell=typeof raw==='object'&&raw!==null?raw:{value:raw},value=cell.value,ref=col(c)+(r+1),style=r===0?1:(cell.style??0);
   if(cell.formula)return `<c r="${ref}" s="${style}"><f>${esc(cell.formula)}</f><v>${Number.isFinite(value)?value:0}</v></c>`;
   if(typeof value==='number'&&Number.isFinite(value))return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
   return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  }).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${end}"/><sheetViews><sheetView workbookViewId="0" rightToLeft="1" showGridLines="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="24"/><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${data}</sheetData>${filter&&rows.length>1?`<autoFilter ref="A1:${end}"/>`:''}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;
 }
 function buildSheets(entries,label,exportedAt){
  const rows=[...entries].sort((a,b)=>a.entry_date.localeCompare(b.entry_date)||String(a.voucher_number).localeCompare(String(b.voucher_number)));
  const m=ReportMath.aggregate(rows);
  const headers=['رقم السند','النوع','التاريخ','الوقت','الطرف','المؤسسة','الجوال','الموقع','المبلغ (ريال)','طريقة الدفع','الوصف','الملاحظات','التاريخ الهجري','المبلغ كتابة','الشهر'];
  const detail=type=>[headers,...rows.filter(r=>r.entry_type===type).map(r=>[String(r.voucher_number||''),type==='incoming'?'قبض':'صرف',number(dateNumber(r.entry_date),3),String(r.entry_time||''),String(r.party_name||''),String(r.company_name||''),String(r.customer_phone||''),String(r.customer_location||''),number(Number(r.amount)),getPaymentAr(r.payment_method),String(r.reason||''),String(r.notes||''),String(r.date_hijri||''),String(r.amount_text||''),r.entry_date.slice(0,7)])];
  const inLast=Math.max(2,m.incoming.length+1),outLast=Math.max(2,m.outgoing.length+1);
  const ir=`'سندات القبض'!$I$2:$I$${inLast}`,or=`'سندات الصرف'!$I$2:$I$${outLast}`;
  const summary=[['المؤشر','القيمة'],['نطاق التصدير',label],['تاريخ التصدير',exportedAt],['إجمالي القبض',formula(`SUM(${ir})`,m.sumIn)],['إجمالي الصرف',formula(`SUM(${or})`,m.sumOut)],['صافي الحركة',formula('B4-B5',m.net)],['عدد سندات القبض',formula(`COUNT(${ir})`,m.incoming.length,4)],['عدد سندات الصرف',formula(`COUNT(${or})`,m.outgoing.length,4)],['إجمالي السندات',formula('B7+B8',m.count,4)],['متوسط سند القبض',formula('IF(B7=0,0,B4/B7)',m.incoming.length?m.sumIn/m.incoming.length:0)],['متوسط سند الصرف',formula('IF(B8=0,0,B5/B8)',m.outgoing.length?m.sumOut/m.outgoing.length:0)],['نسبة الصرف إلى القبض',m.sumIn>0?formula('IF(B4=0,0,B5/B4)',m.sumOut/m.sumIn,5):'غير متاحة: لا يوجد قبض'],['تفسير صافي الحركة','القبض ناقص الصرف المسجل؛ لا يمثل الربح أو رصيد الحساب الفعلي.'],['نطاق الملف','السندات المطابقة للفلاتر وقت التصدير. أرقام الجوال والسندات محفوظة كنص.'],['تحديث المعادلات','المعادلات تغطي الصفوف المصدّرة؛ عند إضافة صفوف جديدة وسّع نطاقاتها.']];
  const grouped=(groups,keyColumn)=>[['البند','القبض (ريال)','الصرف (ريال)','صافي الحركة (ريال)','عدد السندات'],...groups.map((g,i)=>{
   const r=i+2,key=keyColumn==='J'?getPaymentAr(g.key):g.key;
   const ik=`'سندات القبض'!$${keyColumn}$2:$${keyColumn}$${inLast}`,ok=`'سندات الصرف'!$${keyColumn}$2:$${keyColumn}$${outLast}`;
   return [key,formula(`SUMIF(${ik},A${r},${ir})`,g.incoming),formula(`SUMIF(${ok},A${r},${or})`,g.outgoing),formula(`B${r}-C${r}`,g.net),formula(`COUNTIF(${ik},A${r})+COUNTIF(${ok},A${r})`,g.count,4)];
  })];
  return [{name:'ملخص',rows:summary,widths:[32,92]},{name:'سندات القبض',rows:detail('incoming'),widths:[23,12,16,13,30,32,19,35,21,22,48,48,26,65,15],filter:true},{name:'سندات الصرف',rows:detail('outgoing'),widths:[23,12,16,13,30,32,19,35,21,22,48,48,26,65,15],filter:true},{name:'الحركة الشهرية',rows:grouped(m.months,'O'),widths:[24,24,24,27,20],filter:true},{name:'طرق الدفع',rows:grouped(m.payments,'J'),widths:[24,24,24,27,20],filter:true}];
 }
 async function create(entries,label,exportedAt=new Date().toISOString()){
  if(typeof JSZip==='undefined')throw new Error('ملف مكتبة التصدير غير موجود. أعد تحميل الصفحة وحاول مرة أخرى.');
  if(entries.length>100000)throw new Error('عدد السندات كبير للتصدير على الجوال. اختر فترة أصغر لا تتجاوز 100,000 سند.');
  for(const r of entries)if(!excelValidISODate(r.entry_date)||!['incoming','outgoing'].includes(r.entry_type)||!Number.isFinite(Number(r.amount)))throw new Error('يوجد سند بتاريخ أو مبلغ غير صالح. راجع البيانات قبل التصدير.');
  const sheets=buildSheets(entries,label,exportedAt),zip=new JSZip();
  const ns='http://schemas.openxmlformats.org/package/2006/relationships',rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  zip.file('_rels/.rels',`<?xml version="1.0"?><Relationships xmlns="${ns}"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${rel}"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${esc(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels',`<?xml version="1.0"?><Relationships xmlns="${ns}">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${rel}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${rel}/styles" Target="styles.xml"/></Relationships>`);
  zip.file('xl/styles.xml',`<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F48"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6">${[0,0,4,164,1,10].map((fmt,i)=>`<xf numFmtId="${fmt}" fontId="${i===1?1:0}" fillId="${i===1?2:0}" borderId="0" xfId="0" applyAlignment="1" applyNumberFormat="1"><alignment horizontal="${i===1?'center':'right'}" vertical="center" wrapText="1" readingOrder="2"/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  sheets.forEach((s,i)=>zip.file(`xl/worksheets/sheet${i+1}.xml`,sheetXML(s.rows,s.widths,s.filter)));
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 return {buildSheets,create};
})();
let excelExportBusy=false;
async function exportExcelReport(scope){
 if(excelExportBusy)return;
 if(!state.session){showToast('سجل الدخول','سجل الدخول قبل التصدير','error');return}
 const btn=$('excel-'+scope);excelExportBusy=true;setButtonBusy(btn,true,'جاري التصدير...');
 try{
  try{await synchronizeNow('export-excel')}catch(syncError){console.warn('Excel sync skipped:',syncError)}
  let entries,label;
  if(scope==='dashboard'){const report=currentReport();entries=report.metrics.rows;label=report.range.from?`${report.range.from} — ${report.range.to}`:'جميع السندات'}
  else if(scope==='incoming'||scope==='outgoing'){
   const from=$(scope+'From').value,to=$(scope+'To').value;
   if(from&&to&&from>to)throw new Error('تاريخ البداية يتجاوز تاريخ النهاية.');
   entries=getFiltered(scope);label=`${scope==='incoming'?'سندات القبض':'سندات الصرف'} | من ${from||'البداية'} إلى ${to||'النهاية'} | البحث: ${$(scope+'Search').value.trim()||'بدون'}`;
  }else{entries=[...state.entries];label='جميع السندات'}
  if(!entries.length){showToast('لا توجد بيانات','لا توجد سندات مطابقة للنطاق المحدد','error');return}
  const bytes=await HulullExcel.create(entries,label);
  const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`Hulull-${scope}-${todayISO()}.xlsx`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  showToast('تم تجهيز Excel',`تصدير ${entries.length} سند في ملف من خمس أوراق. احفظه من تنزيلات المتصفح.`);
 }catch(error){showToast('تعذر تصدير Excel',error.message||'أعد المحاولة','error')}
 finally{excelExportBusy=false;setButtonBusy(btn,false)}
}
