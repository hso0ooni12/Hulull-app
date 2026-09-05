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
