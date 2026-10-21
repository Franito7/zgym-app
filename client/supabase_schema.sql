-- ==============================================================================
-- SCHEMA SUPABASE ZGYM SAAS - LISTO PARA PRODUCCIÓN
-- Pegar este script en Supabase Dashboard > SQL Editor y hacer clic en RUN.
-- ==============================================================================

-- 1. Extensión pgcrypto para UUIDs y hashes seguros
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabla Unificada de Usuarios y Alumnos (Presencial & Online)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'ALUMNO' CHECK (role IN ('ADMIN', 'ENTRENADOR', 'ALUMNO')),
    trainer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (account_status IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VENCIDO', 'PENDIENTE')),
    goals TEXT,
    birth_date VARCHAR(50),
    is_active INT NOT NULL DEFAULT 1,

    -- Módulo Presencial
    is_presencial INT NOT NULL DEFAULT 1,
    plan_name VARCHAR(100) DEFAULT 'Pase Libre',
    monthly_price NUMERIC(10,2) DEFAULT 0,
    due_date DATE,
    schedule_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb,
    schedule_time VARCHAR(10) DEFAULT '12:00',
    enrollment_date DATE DEFAULT CURRENT_DATE,

    -- Módulo Online
    is_online INT NOT NULL DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(account_status);

-- 3. Tabla de Pagos & Caja Unificada
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    period VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

-- 4. Tabla de Categorías de Ejercicios y Contenidos
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Ejercicios con Video
CREATE TABLE IF NOT EXISTS public.exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON public.exercises(category_id);

-- 6. Tabla de Rutinas
CREATE TABLE IF NOT EXISTS public.routines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla Intermedia: Ejercicios de una Rutina
CREATE TABLE IF NOT EXISTS public.routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INT NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    day_of_week VARCHAR(30) NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10-12',
    notes TEXT,
    order_index INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON public.routine_exercises(routine_id);

-- 8. Tabla de Recursos Multimedia (Videos y PDFs de Biblioteca)
CREATE TABLE IF NOT EXISTS public.media_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('VIDEO', 'PDF')),
    url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    category_id INT REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de Liberación de Contenido por Alumno (Drip Content / Asignaciones)
CREATE TABLE IF NOT EXISTS public.content_releases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_resource_id INT REFERENCES public.media_resources(id) ON DELETE CASCADE,
    routine_id INT REFERENCES public.routines(id) ON DELETE CASCADE,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_content_releases_user ON public.content_releases(user_id);
CREATE INDEX IF NOT EXISTS idx_content_releases_date ON public.content_releases(release_date);

-- 10. Tabla de Calendario, Meets y Auditorías
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('AUDITORIA', 'ENTRENAMIENTO', 'CONTROL', 'MEET')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'COMPLETADO', 'CANCELADO')),
    notes TEXT,
    meet_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON public.calendar_events(user_id, event_date);

-- 11. Tabla de Configuraciones Generales
CREATE TABLE IF NOT EXISTS public.gym_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT
);

-- ==============================================================================
-- 12. Habilitación de Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura seguras
-- Permite acceso público/anon para la app web con clave anon (seguridad gestionada en app)
DROP POLICY IF EXISTS "anon_users_all" ON public.users;
CREATE POLICY "anon_users_all" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_payments_all" ON public.payments;
CREATE POLICY "anon_payments_all" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_categories_all" ON public.categories;
CREATE POLICY "anon_categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_exercises_all" ON public.exercises;
CREATE POLICY "anon_exercises_all" ON public.exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_routines_all" ON public.routines;
CREATE POLICY "anon_routines_all" ON public.routines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_routine_exercises_all" ON public.routine_exercises;
CREATE POLICY "anon_routine_exercises_all" ON public.routine_exercises FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_media_resources_all" ON public.media_resources;
CREATE POLICY "anon_media_resources_all" ON public.media_resources FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_content_releases_all" ON public.content_releases;
CREATE POLICY "anon_content_releases_all" ON public.content_releases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_calendar_events_all" ON public.calendar_events;
CREATE POLICY "anon_calendar_events_all" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_gym_settings_all" ON public.gym_settings;
CREATE POLICY "anon_gym_settings_all" ON public.gym_settings FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 13. Configuración de Storage en Supabase (Bucket zgym-media)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'zgym-media',
            'zgym-media',
            true,
            209715200, -- 200 MB
            ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp']
        )
        ON CONFLICT (id) DO UPDATE SET public = true;
    END IF;
END $$;

-- ==============================================================================
-- 14. Seed Oficial: Usuario Administrador Augusto
-- ==============================================================================
INSERT INTO public.users (
    first_name, last_name, email, phone, role,
    account_status, is_active, is_presencial, is_online,
    plan_name, monthly_price, schedule_time, schedule_days, notes
)
VALUES (
    'Augusto', '', 'augusto@zgym.com', '', 'ADMIN',
    'ACTIVO', 1, 0, 1,
    'Administrador', 0, '12:00', '[1,2,3,4,5]'::jsonb, 'Usuario Administrador Oficial ZGym'
)
ON CONFLICT (email) DO NOTHING;

-- Categorías estructurales del sistema
INSERT INTO public.categories (name, description) VALUES
    ('Fuerza e Hipertrofia', 'Ejercicios con sobrecarga para desarrollo muscular y fuerza máxima'),
    ('Cardio & Resistencia', 'Entrenamientos aeróbicos, intervalos y capacidad de recuperación'),
    ('Auditorías & Evaluaciones', 'Controles antropométricos periódicos y valoraciones técnicas'),
    ('Movilidad & Core', 'Preparación articular, control postural y estabilidad del core')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 15. Seed Oficial en Supabase Auth: Usuario Administrador Augusto
-- Permite login inmediato con Supabase Auth sin requerir confirmación de email
-- ==============================================================================
DO $$
DECLARE
    admin_uid uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'augusto@zgym.com') THEN
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                recovery_sent_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                admin_uid,
                'authenticated',
                'authenticated',
                'augusto@zgym.com',
                crypt('Augusto2026!', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"first_name":"Augusto","role":"ADMIN"}'::jsonb,
                NOW(),
                NOW(),
                '',
                '',
                '',
                ''
            );

            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'identities') THEN
                INSERT INTO auth.identities (
                    id,
                    user_id,
                    identity_data,
                    provider,
                    provider_id,
                    last_sign_in_at,
                    created_at,
                    updated_at
                ) VALUES (
                    admin_uid,
                    admin_uid,
                    jsonb_build_object('sub', admin_uid::text, 'email', 'augusto@zgym.com'),
                    'email',
                    'augusto@zgym.com',
                    NOW(),
                    NOW(),
                    NOW()
                ) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END IF;
END $$;
