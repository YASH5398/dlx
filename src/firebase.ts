import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQmsuYlFQExy2q0sZDbM7yPJHRzMZgKak",
  authDomain: "digilinex-a80a9.firebaseapp.com",
  databaseURL: "https://digilinex-a80a9-default-rtdb.firebaseio.com",
  projectId: "digilinex-a80a9",
  storageBucket: "digilinex-a80a9.firebasestorage.app",
  messagingSenderId: "197674020609",
  appId: "1:197674020609:web:e9ef458ab7186edf7bf500",
  measurementId: "G-ZT73D96ZYE",
};

const app = initializeApp(firebaseConfig);

// Guard analytics for non-browser environments
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  isSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {
      // ignore analytics errors in dev
    });
}

export const auth = getAuth(app);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export default app;