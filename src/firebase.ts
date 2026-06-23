import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from "axios";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBTgPn9DbyjEDD6cDjTH4S8Z3bqEw8wrtQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "omnigym-solution.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "omnigym-solution",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "omnigym-solution.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "595710961751",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:595710961751:web:e19445f1ab18ceaf419b12",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D6H82W3ENY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestNotificationPermissionAndGetToken = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Fetch VAPID key from environment variables if present
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
      
      const token = await getToken(messaging, { vapidKey });
      if (token) {
        console.log("[Firebase] FCM Registration Token obtained:", token);
        
        // Save FCM token to backend database for current user session
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
        const authToken = localStorage.getItem("token");
        if (authToken) {
          await axios.post(
            `${apiBaseUrl}/notifications/fcm-token`,
            { fcm_token: token },
            {
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }
          );
          console.log("[Firebase] FCM token saved to backend.");
        }
        return token;
      } else {
        console.warn("[Firebase] No registration token available.");
      }
    } else {
      console.warn("[Firebase] Notification permission denied.");
    }
  } catch (err) {
    console.error("[Firebase] An error occurred while retrieving token:", err);
  }
  return null;
};

// Hook for registering onMessage handler
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
