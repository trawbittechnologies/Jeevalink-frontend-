importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyA5eAvl7HpMibKakfPcbUGT8N-ae16JGbU",
  authDomain: "idonate---dyfi-kasaragod.firebaseapp.com",
  projectId: "idonate---dyfi-kasaragod",
  storageBucket: "idonate---dyfi-kasaragod.firebasestorage.app",
  messagingSenderId: "649937525559",
  appId: "1:649937525559:web:c20eb15c92dac9f8a198b2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'JeevaLink Alert';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/logo.png', // Ensure this exists or use appropriate default
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
