# Streaming LiveKit Pro Final

Plataforma privada de streaming con Google Login, LiveKit, chat y panel de administrador.

## Iniciar en local

```cmd
npm install
copy .env.example .env
npm start
```

Abre: http://localhost:3000/login

## Variables necesarias

```env
APP_URL=http://localhost:3000
SESSION_SECRET=clave-larga
ADMIN_EMAIL=tu_correo@gmail.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LIVEKIT_URL=wss://tu-proyecto.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_ROOM=ochoa-live
```

## Google OAuth local

Authorized JavaScript origins:

```txt
http://localhost:3000
```

Authorized redirect URIs:

```txt
http://localhost:3000/auth/google/callback
```

## Railway

En Railway agrega las mismas variables, pero cambia APP_URL por la URL pública de Railway.
