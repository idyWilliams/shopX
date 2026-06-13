-- shopX Multi-Tenant SaaS PostgreSQL Schema
-- Designed for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations Table (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_pro BOOLEAN NOT NULL DEFAULT FALSE,
    pro_expiry_date TIMESTAMP WITH TIME ZONE
);

-- 2. Profiles Table (Auth Users + Organization Links)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'assistant')),
    name TEXT NOT NULL,
    referral_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Locations Table (Shop Branches, Storage, etc.)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'shop',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    base_currency TEXT NOT NULL DEFAULT 'NGN',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Inventory Table (Product-Location Quantities)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_location UNIQUE (product_id, location_id)
);

-- 6. Activities Table (Timeline Feed)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sale', 'restock', 'transfer', 'anomaly')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    target_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Shifts Table (Handover/Reconciliation)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
    declared_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    declared_transfers NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_transfers NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending', 'matched', 'discrepancy')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for Multi-Tenancy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Insert Seed Data (Optional but Recommended for Testing)
INSERT INTO organizations (name, tier) VALUES 
('Fashion Haven Ltd', 'premium');

INSERT INTO locations (org_id, name, type) VALUES 
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Victoria Island', 'shop'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Lekki Suite', 'shop'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Home Storage (Ikeja)', 'storage');

INSERT INTO products (org_id, name, category, base_currency, cost_price, selling_price, image_url) VALUES 
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Ankara Weekend Dress', 'Ankara', 'NGN', 8500, 15000, 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Ankara Two-Piece Set', 'Ankara', 'NGN', 12000, 22000, 'https://images.unsplash.com/photo-1583391720851-9748e2d3e2b5?w=400'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Nigerian Lace Fabric - Gold', 'Lace', 'NGN', 25000, 45000, 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Leather Slides - Tan', 'Shoes', 'NGN', 6000, 12000, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Designer Heels - Red', 'Shoes', 'NGN', 18000, 35000, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400'),
((SELECT id FROM organizations WHERE name = 'Fashion Haven Ltd'), 'Leather Tote Bag - Cognac', 'Bags', 'NGN', 22000, 42000, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400');

-- Seed Inventory
INSERT INTO inventory (product_id, location_id, quantity) VALUES 
((SELECT id FROM products WHERE name = 'Ankara Weekend Dress'), (SELECT id FROM locations WHERE name = 'Victoria Island'), 35),
((SELECT id FROM products WHERE name = 'Ankara Weekend Dress'), (SELECT id FROM locations WHERE name = 'Lekki Suite'), 25),
((SELECT id FROM products WHERE name = 'Ankara Weekend Dress'), (SELECT id FROM locations WHERE name = 'Home Storage (Ikeja)'), 80),
((SELECT id FROM products WHERE name = 'Ankara Two-Piece Set'), (SELECT id FROM locations WHERE name = 'Victoria Island'), 28),
((SELECT id FROM products WHERE name = 'Ankara Two-Piece Set'), (SELECT id FROM locations WHERE name = 'Lekki Suite'), 22),
((SELECT id FROM products WHERE name = 'Nigerian Lace Fabric - Gold'), (SELECT id FROM locations WHERE name = 'Victoria Island'), 12),
((SELECT id FROM products WHERE name = 'Leather Slides - Tan'), (SELECT id FROM locations WHERE name = 'Lekki Suite'), 45),
((SELECT id FROM products WHERE name = 'Designer Heels - Red'), (SELECT id FROM locations WHERE name = 'Victoria Island'), 3),
((SELECT id FROM products WHERE name = 'Leather Tote Bag - Cognac'), (SELECT id FROM locations WHERE name = 'Home Storage (Ikeja)'), 18);
