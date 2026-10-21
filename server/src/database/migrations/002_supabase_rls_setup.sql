-- ==============================================================================
-- Migración 002: Configuración Integral de Supabase (PostgreSQL + RLS + Storage)
-- ==============================================================================

-- 1. Habilitar extensión pgcrypto (para UUIDs y cifrado si se requiere)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Asegurar Esquema Unificado de Tablas
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'ALUMNO' CHECK (role IN ('ADMIN', 'ENTRENADOR', 'ALUMNO')),
    phone VARCHAR(30),
    trainer_id INT REFERENCES users(id) ON DELETE SET NULL,
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (account_status IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VENCIDO', 'PENDIENTE')),
    goals TEXT,
    birth_date VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Módulo Presencial
    is_presencial BOOLEAN NOT NULL DEFAULT TRUE,
    plan_name VARCHAR(100) DEFAULT 'Pase Libre',
    monthly_price NUMERIC(10,2) DEFAULT 0,
    due_date DATE,
    schedule_days VARCHAR(50) DEFAULT '[1,2,3,4,5]',
    schedule_time VARCHAR(10) DEFAULT '12:00',
    enrollment_date DATE DEFAULT CURRENT_DATE,

    -- Módulo Online
    is_online BOOLEAN NOT NULL DEFAULT FALSE,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    period VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    day_of_week VARCHAR(30) NOT NULL,
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10-12',
    notes TEXT,
    order_index INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS media_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    type VARCHAR(10) NOT NULL CHECK (type IN ('VIDEO', 'PDF')),
    url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_releases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_resource_id INT REFERENCES media_resources(id) ON DELETE CASCADE,
    routine_id INT REFERENCES routines(id) ON DELETE CASCADE,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('AUDITORIA', 'ENTRENAMIENTO', 'CONTROL', 'MEET', 'SEGUIMIENTO', 'EVENTO', 'LIBERACION')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE', 'COMPLETADO', 'CANCELADO')),
    notes TEXT,
    meet_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gym_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT
);

-- ==============================================================================
-- 3. Habilitación de Row Level Security (RLS) en todas las tablas
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. Políticas de Seguridad (RLS Policies)
-- ==============================================================================

-- Función auxiliar para verificar si el usuario conectado o el token es ADMIN
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    -- Si es conexión por service_role (backend API) o usuario con claim ADMIN
    IF current_user IN ('postgres', 'service_role') THEN
        RETURN TRUE;
    END IF;
    RETURN coalesce((current_setting('request.jwt.claim.role', true) = 'ADMIN'), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLÍTICAS: USERS ---
DROP POLICY IF EXISTS "service_role_all_users" ON users;
CREATE POLICY "service_role_all_users" ON users
    FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "students_view_own_profile" ON users;
CREATE POLICY "students_view_own_profile" ON users
    FOR SELECT
    USING (email = current_setting('request.jwt.claim.email', true));

-- --- POLÍTICAS: PAYMENTS ---
DROP POLICY IF EXISTS "service_role_all_payments" ON payments;
CREATE POLICY "service_role_all_payments" ON payments
    FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "students_view_own_payments" ON payments;
CREATE POLICY "students_view_own_payments" ON payments
    FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claim.email', true)
    ));

-- --- POLÍTICAS: CATEGORIES & EXERCISES ---
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_categories" ON categories;
CREATE POLICY "admin_manage_categories" ON categories FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "public_read_exercises" ON exercises;
CREATE POLICY "public_read_exercises" ON exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_exercises" ON exercises;
CREATE POLICY "admin_manage_exercises" ON exercises FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

-- --- POLÍTICAS: ROUTINES & ROUTINE_EXERCISES ---
DROP POLICY IF EXISTS "public_read_routines" ON routines;
CREATE POLICY "public_read_routines" ON routines FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_routines" ON routines;
CREATE POLICY "admin_manage_routines" ON routines FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "public_read_routine_exercises" ON routine_exercises;
CREATE POLICY "public_read_routine_exercises" ON routine_exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_routine_exercises" ON routine_exercises;
CREATE POLICY "admin_manage_routine_exercises" ON routine_exercises FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

-- --- POLÍTICAS: MEDIA_RESOURCES ---
DROP POLICY IF EXISTS "read_media_resources" ON media_resources;
CREATE POLICY "read_media_resources" ON media_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_media" ON media_resources;
CREATE POLICY "admin_manage_media" ON media_resources FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

-- --- POLÍTICAS: CONTENT_RELEASES ---
DROP POLICY IF EXISTS "admin_manage_releases" ON content_releases;
CREATE POLICY "admin_manage_releases" ON content_releases FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "students_view_released_content" ON content_releases;
CREATE POLICY "students_view_released_content" ON content_releases FOR SELECT
    USING (
        user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claim.email', true))
        AND release_date <= CURRENT_TIMESTAMP
        AND is_active = TRUE
    );

-- --- POLÍTICAS: CALENDAR_EVENTS ---
DROP POLICY IF EXISTS "admin_manage_calendar" ON calendar_events;
CREATE POLICY "admin_manage_calendar" ON calendar_events FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

DROP POLICY IF EXISTS "students_view_own_events" ON calendar_events;
CREATE POLICY "students_view_own_events" ON calendar_events FOR SELECT
    USING (user_id IN (
        SELECT id FROM users WHERE email = current_setting('request.jwt.claim.email', true)
    ));

-- --- POLÍTICAS: GYM_SETTINGS ---
DROP POLICY IF EXISTS "read_gym_settings" ON gym_settings;
CREATE POLICY "read_gym_settings" ON gym_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_gym_settings" ON gym_settings;
CREATE POLICY "admin_manage_gym_settings" ON gym_settings FOR ALL
    USING (current_user IN ('postgres', 'service_role') OR is_admin());

-- ==============================================================================
-- 5. Configuración de Bucket en Supabase Storage (zgym-media)
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
-- 6. Semilla Inicial: Administrador Augusto
-- ==============================================================================
INSERT INTO users (
    first_name, last_name, email, password_hash, role,
    phone, account_status, is_active, is_presencial, is_online,
    plan_name, monthly_price, schedule_time, schedule_days, notes
)
VALUES (
    'Augusto', '', 'augusto@zgym.com',
    '$2a$10$7vN3lM8d3b7NfB899qO60uvVjYmQGj2H9UfxQO8yZ5Rk8W9W1Qv9e', -- Augusto2026!
    'ADMIN', '', 'ACTIVO', true, false, true,
    'Administrador', 0, '12:00', '[1,2,3,4,5]', 'Usuario Administrador Oficial ZGym'
)
ON CONFLICT (email) DO NOTHING;

-- Categorías estructurales
INSERT INTO categories (name, description) VALUES
    ('Fuerza e Hipertrofia', 'Ejercicios con sobrecarga para desarrollo muscular y fuerza máxima'),
    ('Cardio & Resistencia', 'Entrenamientos aeróbicos, intervalos y capacidad de recuperación'),
    ('Auditorías & Evaluaciones', 'Controles antropométricos periódicos y valoraciones técnicas'),
    ('Movilidad & Core', 'Preparación articular, control postural y estabilidad del core')
ON CONFLICT (name) DO NOTHING;
