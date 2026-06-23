// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Compat SDKs inside Web Worker contexts
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  apiKey: "AIzaSyBTgPn9DbyjEDD6cDjTH4S8Z3bqEw8wrtQ",
  authDomain: "omnigym-solution.firebaseapp.com",
  projectId: "omnigym-solution",
  storageBucket: "omnigym-solution.firebasestorage.app",
  messagingSenderId: "595710961751",
  appId: "1:595710961751:web:e19445f1ab18ceaf419b12",
  measurementId: "G-D6H82W3ENY"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title || 'OmniGym Alert';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
