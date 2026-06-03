self.addEventListener('push', event => {

 let data = {
   title:'Congregación Fleming',
   body:'Nueva actualización'
 };

 if(event.data){

   try{
      data=event.data.json();
   }catch{
      data.body=event.data.text();
   }

 }

 event.waitUntil(

   self.registration.showNotification(
      data.title,
      {
        body:data.body,
        icon:'/android-chrome-192x192.png',
        badge:'/icons/favicon-32x32.png',
        data:{url:data.url||"/"}
      }
   )

 );

});

self.addEventListener('notificationclick', event=>{

 event.notification.close();

 event.waitUntil(
   clients.openWindow(
      event.notification.data.url || '/'
   )
 );

});
