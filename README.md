# Clasificador de animales online

Aplicación web para identificar animales a partir de fotos, con autenticación Firebase y registro de escaneos en Firestore.

## Tecnologías

- React + Vite + TypeScript
- Firebase (Auth + Firestore)
- Tailwind CSS · Motion · Sonner

## Requisitos

- Node.js 18+
- Proyecto Firebase con Auth (email/contraseña) y Firestore

## Instalación

```bash
npm install
```

Copia `.env.example` a `.env` y completa las variables `VITE_FIREBASE_*`.  
Si usas una base Firestore con ID `default`, añade `VITE_FIREBASE_DATABASE_ID=default`.

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
```

Despliegue recomendado en [Vercel](https://vercel.com) con las mismas variables de entorno.

## Estructura

- `src/app/components/AnimalScanner.tsx` — escáner de imágenes
- `src/app/components/ProfilePage.tsx` — perfil y últimos escaneos
- `src/app/lib/firebase.ts` — configuración Firebase

## Autor

Proyecto académico — trabajo final.
