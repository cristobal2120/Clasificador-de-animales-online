import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function requireEnv(name: string): string {
  const v = (import.meta.env as Record<string, string | undefined>)[name];
  if (!v) {
    throw new Error(
      `Falta la variable de entorno ${name}. Crea un archivo .env en la raíz (junto a package.json) y reinicia Vite.`
    );
  }
  return v;
}

const firebaseConfig = {
  apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("VITE_FIREBASE_APP_ID"),
  measurementId: (import.meta.env as Record<string, string | undefined>).VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// ID de la base en Firebase Console → Firestore (ej. "default" o "(default)")
const firestoreDatabaseId = (import.meta.env as Record<string, string | undefined>)
  .VITE_FIREBASE_DATABASE_ID;

export const db = firestoreDatabaseId
  ? getFirestore(firebaseApp, firestoreDatabaseId)
  : getFirestore(firebaseApp);

