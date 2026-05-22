import { User } from "../types";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

type AuthResult = { success: boolean; user?: User; error?: string };

async function getUserProfile(uid: string): Promise<User | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as User) : null;
}

export async function login(emailOrUsername: string, password: string): Promise<AuthResult> {
  try {
    if (!emailOrUsername.includes("@")) {
      return { success: false, error: "Ingresa tu email (no usuario) para iniciar sesión" };
    }

    const cred = await signInWithEmailAndPassword(auth, emailOrUsername, password);
    const profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      return {
        success: true,
        user: {
          id: cred.user.uid,
          username: cred.user.email?.split("@")[0] ?? "user",
          email: cred.user.email ?? emailOrUsername,
          avatar: "👤",
          createdAt: new Date().toISOString(),
          role: "user",
        },
      };
    }
    return { success: true, user: profile };
  } catch (e: unknown) {
    const code = String((e as { code?: string })?.code || "");
    const message = String((e as { message?: string })?.message || "");
    if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password") || code.includes("auth/invalid-login-credentials")) {
      return { success: false, error: "Email o contraseña incorrectos" };
    }
    if (code.includes("auth/user-not-found")) return { success: false, error: "Usuario no encontrado" };
    if (code.includes("auth/too-many-requests")) return { success: false, error: "Demasiados intentos. Espera un momento." };
    if (code.includes("auth/network-request-failed")) return { success: false, error: "Sin conexión. Revisa tu internet." };
    if (message.includes("offline") || message.includes("not found")) {
      return { success: false, error: "Firestore no disponible. Revisa la base de datos en Firebase." };
    }
    return { success: false, error: "Error al iniciar sesión" };
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
  avatar: string
): Promise<AuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: User = {
      id: cred.user.uid,
      username,
      email,
      avatar,
      createdAt: new Date().toISOString(),
      role: "user",
    };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    return { success: true, user: profile };
  } catch (e: any) {
    const code = String(e?.code || "");
    if (code.includes("auth/email-already-in-use")) return { success: false, error: "El email ya está registrado" };
    if (code.includes("auth/invalid-email")) return { success: false, error: "Email inválido" };
    if (code.includes("auth/weak-password")) return { success: false, error: "Contraseña muy débil" };
    return { success: false, error: "Error al registrar" };
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

// Deprecated: Firebase Auth handles session persistence automatically.
export function getSession(): User | null {
  return null;
}
