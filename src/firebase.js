import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, runTransaction } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

let db = null;
let initialized = false;

function initFirebase() {
  if (initialized || typeof window === 'undefined' || !firebaseConfig.apiKey || !firebaseConfig.projectId) return null;

  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    initialized = true;
    console.log('Firebase initialized for project:', firebaseConfig.projectId);
    return db;
  } catch (error) {
    initialized = true;
    console.error('Firebase init error:', error);
    return null;
  }
}

export async function incrementPortfolioViews(dayKey, monthKey, yearKey) {
  const store = initFirebase();
  if (!store) return null;

  const viewRef = doc(store, 'portfolio', 'views');

  try {
    return await runTransaction(store, async (transaction) => {
      const snapshot = await transaction.get(viewRef);
      const current = snapshot.exists() ? snapshot.data() : { daily: {}, monthly: {}, yearly: {}, total: 0, lastVisit: '', updatedAt: null };

      const next = {
        daily: { ...current.daily, [dayKey]: (current.daily?.[dayKey] || 0) + 1 },
        monthly: { ...current.monthly, [monthKey]: (current.monthly?.[monthKey] || 0) + 1 },
        yearly: { ...current.yearly, [yearKey]: (current.yearly?.[yearKey] || 0) + 1 },
        total: (current.total || 0) + 1,
        lastVisit: dayKey,
        updatedAt: new Date(),
      };

      transaction.set(viewRef, next, { merge: true });
      return next;
    });
  } catch (error) {
    console.error('Firestore increment error:', error);
    return null;
  }
}

export async function getPortfolioViews() {
  const store = initFirebase();
  if (!store) return null;

  try {
    const snapshot = await getDoc(doc(store, 'portfolio', 'views'));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Firestore get error:', error);
    return null;
  }
}
