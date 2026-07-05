# Streaming Live Pro

Plataforma privada de streaming con login Google, admin único, chat en vivo, pantalla compartida como video principal y cámara flotante encima.

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

## Producción Railway

Configura variables:

```env
APP_URL=https://tu-dominio.up.railway.app
SESSION_SECRET=secreto_largo
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
ADMIN_EMAIL=tu_correo@gmail.com
```

En Google Cloud agrega:

- Origin: `https://tu-dominio.up.railway.app`
- Redirect URI: `https://tu-dominio.up.railway.app/auth/google/callback`
