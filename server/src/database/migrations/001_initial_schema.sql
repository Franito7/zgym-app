-- ==============================================================================
-- Migración 001: Esquema Unificado ZGym (Gestión Presencial & Asesorías Online)
-- ==============================================================================

-- 1. Tabla de Usuarios / Clientes (Entidad Única)
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
    schedule_time VARCHAR(10) DEFAULT '09:00',
    enrollment_date DATE DEFAULT CURRENT_DATE,

    -- Módulo Online
    is_online BOOLEAN NOT NULL DEFAULT FALSE,

    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status);

-- 2. Tabla de Pagos & Caja Unificada
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

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 3. Tabla de Categorías (Grupos musculares, auditorías, etc.)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Ejercicios
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);

-- 5. Tabla de Rutinas
CREATE TABLE IF NOT EXISTS routines (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla Intermedia: Ejercicios de una Rutina
CREATE TABLE IF NOT EXISTS routine_exercises (
    id SERIAL PRIMARY KEY,
    routine_id INT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    day_of_week VARCHAR(30) NOT NULL, -- Ej: 'Día 1', 'Lunes', 'Piernas'
    sets INT NOT NULL DEFAULT 3,
    reps VARCHAR(50) NOT NULL DEFAULT '10-12',
    notes TEXT,
    order_index INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine ON routine_exercises(routine_id);

-- 7. Tabla de Recursos Multimedia (Videos instructivos y PDFs de auditorías)
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

CREATE INDEX IF NOT EXISTS idx_media_type ON media_resources(type);

-- 8. Tabla de Liberación de Contenido por Alumno (Drip Content / Auditorías)
CREATE TABLE IF NOT EXISTS content_releases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_resource_id INT REFERENCES media_resources(id) ON DELETE CASCADE,
    routine_id INT REFERENCES routines(id) ON DELETE CASCADE,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_content_reference CHECK (media_resource_id IS NOT NULL OR routine_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_content_releases_user ON content_releases(user_id);
CREATE INDEX IF NOT EXISTS idx_content_releases_date ON content_releases(release_date);

-- 9. Tabla de Eventos de Calendario (Auditorías, Entrenamientos, Meets)
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

CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, event_date);

-- 10. Configuración General del Gimnasio
CREATE TABLE IF NOT EXISTS gym_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT
);
