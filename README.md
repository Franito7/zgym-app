# ZGym SaaS - Plataforma Integral de Gimnasio & Asesorías Online

**ZGym** es una plataforma SaaS moderna, **Progressive Web App (PWA) Mobile-First**, diseñada para entrenadores personales y dueños de gimnasios. Unifica la gestión presencial de cuotas, membresías y asistencias con la gestión integral de asesorías online (rutinas compuestas por ejercicios, biblioteca de videos/PDFs y programación de Google Meets) en un solo producto.

---

## ⚡ Arquitectura SaaS Serverless (Vercel + Supabase)

El proyecto cuenta con una arquitectura moderna **100% Serverless**:
- **Frontend / PWA**: React 19 + TypeScript + Vite desplegado en **Vercel**.
- **Backend / Database / Auth / Storage**: **Supabase** (PostgreSQL administrado + Supabase Auth + Supabase Storage + RLS).
- **Sin servidores Node/Express ni dependencias de `localhost:5000`**. El frontend consulta y autentica directamente contra la nube de Supabase con `@supabase/supabase-js`.

---

## 🔐 Credenciales del Administrador (Primer Deploy / Demo)

El sistema inicia en estado **100% limpio (cero alumnos ficticios, cero cobros falsos, cero rutinas demo)**, listo para ser presentado a un cliente real.

- **Usuario**: Augusto
- **Rol**: Administrador
- **Email**: `augusto@zgym.com`
- **Contraseña**: `Augusto2026!`

*(Las credenciales no se encuentran expuestas ni hardcodeadas en la interfaz pública de login).*

---

## 🚀 Despliegue Paso a Paso en Vercel & Supabase

### 1. Preparar la Base de Datos en Supabase (2 minutos)
1. Creá un proyecto gratuito en [Supabase](https://supabase.com).
2. Andá a **SQL Editor** en el panel de Supabase.
3. Copiá el contenido del archivo [`client/supabase_schema.sql`](file:///client/supabase_schema.sql) y hacé clic en **Run**.
   - Esto creará todas las tablas con sus relaciones e índices (`users`, `payments`, `routines`, `exercises`, `categories`, `media_resources`, `content_releases`, `calendar_events`).
   - Habilitará la seguridad RLS (Row Level Security).
   - Creará el bucket de almacenamiento público `zgym-media` para imágenes y videos de ejercicios.
   - Insertará el usuario administrador inicial `augusto@zgym.com`.

### 2. Desplegar en Vercel
1. Conectá el repositorio en **Vercel**.
2. En la configuración del proyecto:
   - **Root Directory**: `client` (o dejar raíz si usás el `vercel.json` de raíz).
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. En la sección **Environment Variables** de Vercel, agregá:
   - `VITE_SUPABASE_URL`: La URL de tu proyecto Supabase (`https://xxxx.supabase.co`).
   - `VITE_SUPABASE_ANON_KEY`: La clave pública `anon` de tu proyecto.
   - `VITE_SUPABASE_STORAGE_BUCKET`: `zgym-media`
4. Hacé clic en **Deploy**.

¡Listo! Tu aplicación estará activa en `https://tu-proyecto.vercel.app` y se podrá instalar en Android e iOS como una app nativa.

---

## 💻 Desarrollo Local

Para correr la PWA en desarrollo local:
```bash
cd client
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:5173`. Si configurás `.env` con tus credenciales de Supabase, se conectará a tu base en la nube.

---

## 📱 Filosofía & Arquitectura de Navegación

Diseñado para operarse **con una sola mano desde el celular**:
- **Bottom Navigation Fija**:
  - `Inicio`: Dashboard operativo con saludo personalizado a Augusto, KPIs en tiempo real (Vencidos, Por Vencer, Caja Mes, Turnos Hoy), alertas de cobro inmediato con 1-clic a WhatsApp y accesos directos a Meets del día.
  - `Alumnos`: Directorio unificado de alumnos presenciales, clientes online e híbridos con búsqueda en tiempo real y Ficha 360°.
  - `Pagos`: Control de caja unificado para mensualidades presenciales y servicios de asesoría online, con desglose de métodos de pago y anulación de registros.
  - `Online`: Panel técnico de 4 módulos:
    1. **Rutinas**: Constructor de planes de entrenamiento vinculando ejercicios del catálogo con series, repeticiones y notas técnicas.
    2. **Ejercicios**: Catálogo categorizado con videos demostrativos y reproducción integrada.
    3. **Biblioteca**: Gestor de recursos audiovisuales (videos subidos, links de YouTube/Vimeo y auditorías PDF descargables).
    4. **Meets**: Agenda de videollamadas con enlaces de Google Meet y seguimiento personalizado.
  - `Más`: Respaldo en JSON descargable en 1 clic, botón de instalación PWA en dispositivo móvil y cambio de contraseña.
- **QuickActionFab**: Botón flotante accesible con el pulgar para crear alumnos, registrar pagos o diseñar rutinas rápidamente.

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v6, Service Worker PWA.
- **Backend / Database**: Supabase Client (`@supabase/supabase-js`), PostgreSQL administrado, Supabase Auth, Supabase Storage (Bucket `zgym-media`), Row Level Security (RLS).
