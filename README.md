# ZGym SaaS - Plataforma Integral de Gimnasio & Asesorías Online (Release Candidate)

**ZGym** es una plataforma SaaS moderna, **Progressive Web App (PWA) Mobile-First**, diseñada para entrenadores personales y dueños de gimnasios. Unifica la gestión presencial de cuotas, membresías y asistencias con la gestión integral de asesorías online (rutinas compuestas por ejercicios, biblioteca de videos/PDFs y programación de Google Meets) en un solo producto.

---

## 🔐 Credenciales del Administrador (Primer Deploy / Demo)

El sistema inicia en estado **100% limpio (cero alumnos ficticios, cero cobros falsos, cero rutinas demo)**, listo para ser presentado a un cliente real.

- **Usuario**: Augusto
- **Rol**: Administrador
- **Email**: `augusto@zgym.com`
- **Contraseña**: `Augusto2026!`

*(Las credenciales no se encuentran expuestas ni hardcodeadas en la interfaz pública de login).*

---

## 🚀 Despliegue en Vercel (Producción)

### Opción 1: Despliegue Directo del Frontend (Recomendado para Demo)
1. Conectá el repositorio en **Vercel**.
2. En la configuración del proyecto:
   - **Root Directory**: `client` (o dejar raíz si usás el `vercel.json` de raíz ya configurado).
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Variables de entorno (opcional si el backend está en un servidor externo):
   - `VITE_API_URL`: URL de tu backend (ej. `https://api.tu-dominio.com/api`). Si no se define, utiliza el proxy relativo `/api`.
4. El archivo `client/vercel.json` ya incluye las reglas de reescritura para Single Page Application (SPA), headers de caché para assets estáticos y políticas del Service Worker para instalación PWA.

### Opción 2: Ejecución Local
Hacé doble clic en `iniciar.bat` o desde la terminal:
```bash
# Terminal 1 - Backend (Puerto 5000)
cd server
npm run dev

# Terminal 2 - Frontend PWA (Puerto 5173)
cd client
npm run dev
```

---

## 📱 Filosofía & Arquitectura de Navegación

Diseñado para operarse **con una sola mano desde el celular**:
- **Bottom Navigation Fija**:
  - `Inicio`: Dashboard operativo con saludo personalizado a Augusto, KPIs en tiempo real (Vencidos, Por Vencer, Caja Mes, Turnos Hoy), alertas de cobro inmediato con 1-clic a WhatsApp y accesos directos a Meets del día.
  - `Clientes`: Directorio unificado de alumnos presenciales, clientes online e híbridos con búsqueda en tiempo real y Ficha 360°.
  - `Pagos`: Control de caja unificado para mensualidades presenciales y servicios de asesoría online, con desglose de métodos de pago y anulación de registros.
  - `Online`: Panel técnico de 4 módulos:
    1. **Rutinas**: Constructor de planes de entrenamiento vinculando ejercicios del catálogo con series, repeticiones y notas técnicas.
    2. **Ejercicios**: Catálogo categorizado con videos demostrativos y reproducción integrada.
    3. **Biblioteca**: Gestor de recursos audiovisuales (videos subidos, links de YouTube/Vimeo y auditorías PDF descargables).
    4. **Meets**: Agenda de videollamadas con enlaces de Google Meet y seguimiento personalizado.
  - `Más`: Respaldo en JSON descargable en 1 clic, botón de instalación PWA en dispositivo móvil y cambio de contraseña.
- **QuickActionFab**: Botón flotante accesible con el pulgar para crear clientes, registrar pagos o diseñar rutinas rápidamente.

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router v6, Service Worker PWA.
- **Backend**: Node.js, Express, SQLite persistente en disco (`better-sqlite3`) y soporte nativo para PostgreSQL (`pg`) en producción mediante `DATABASE_URL`, JWT y bcryptjs.
