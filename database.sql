-- Karbon Ayak İzi Hesaplama Projesi Veritabanı
-- SQLite 3.x uyumlu

-- Kullanıcılar tablosu
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    birth_date TEXT,
    user_type TEXT DEFAULT 'user' CHECK (user_type IN ('user', 'admin')),
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Karbon ayak izi hesaplamaları tablosu
CREATE TABLE carbon_calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    calculation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_carbon_footprint REAL NOT NULL,
    electricity_usage REAL DEFAULT 0,
    natural_gas_usage REAL DEFAULT 0,
    water_usage REAL DEFAULT 0,
    waste_production REAL DEFAULT 0,
    transportation REAL DEFAULT 0,
    business_travel REAL DEFAULT 0,
    employee_commute REAL DEFAULT 0,
    paper_usage REAL DEFAULT 0,
    other_emissions REAL DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Karbon faktörleri tablosu (admin tarafından yönetilir)
CREATE TABLE carbon_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factor_name TEXT NOT NULL,
    factor_value REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan karbon faktörleri
INSERT INTO carbon_factors (factor_name, factor_value, unit, category, description) VALUES
('Elektrik', 0.5, 'kg CO2e/kWh', 'energy', 'Türkiye elektrik şebekesi ortalama karbon faktörü'),
('Doğal Gaz', 2.1, 'kg CO2e/m3', 'energy', 'Doğal gaz yanması karbon faktörü'),
('Su', 0.3, 'kg CO2e/m3', 'water', 'Su arıtma ve dağıtım karbon faktörü'),
('Atık', 0.5, 'kg CO2e/kg', 'waste', 'Katı atık işleme karbon faktörü'),
('Benzin', 2.3, 'kg CO2e/litre', 'transport', 'Benzin yakıt karbon faktörü'),
('Dizel', 2.7, 'kg CO2e/litre', 'transport', 'Dizel yakıt karbon faktörü'),
('Kağıt', 0.8, 'kg CO2e/kg', 'materials', 'Kağıt üretimi karbon faktörü'),
('Uçak', 0.25, 'kg CO2e/km', 'travel', 'Kısa mesafe uçak yolculuğu'),
('Otobüs', 0.05, 'kg CO2e/km', 'travel', 'Şehirlerarası otobüs'),
('Tren', 0.04, 'kg CO2e/km', 'travel', 'Elektrikli tren');

-- Admin kullanıcısı oluştur (şifre: admin123)
INSERT INTO users (username, first_name, last_name, email, password_hash, user_type) VALUES
('admin', 'Admin', 'User', 'admin@ecotech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Örnek kullanıcı (şifre: user123)
INSERT INTO users (username, first_name, last_name, email, password_hash, phone, company_name) VALUES
('demo_user', 'Demo', 'Kullanıcı', 'demo@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '5551234567', 'Demo Şirket A.Ş.');

-- Örnek karbon hesaplamaları
INSERT INTO carbon_calculations (user_id, total_carbon_footprint, electricity_usage, natural_gas_usage, water_usage, waste_production, transportation, notes) VALUES
(2, 1250.50, 500.00, 300.00, 150.00, 100.00, 200.50, 'Ocak 2024 hesaplaması'),
(2, 1180.75, 480.00, 280.00, 140.00, 95.00, 185.75, 'Şubat 2024 hesaplaması'),
(2, 1320.25, 520.00, 320.00, 160.00, 110.00, 210.25, 'Mart 2024 hesaplaması');

-- İndeksler
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_carbon_calculations_user_id ON carbon_calculations(user_id);
CREATE INDEX idx_carbon_calculations_date ON carbon_calculations(calculation_date);
CREATE INDEX idx_carbon_factors_category ON carbon_factors(category); 