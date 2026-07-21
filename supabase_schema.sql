-- Core table: merchants
CREATE TABLE merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can see own data" ON merchants FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Merchants can insert own data" ON merchants FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Merchants can update own data" ON merchants FOR UPDATE USING (auth.uid() = id);

-- Core table: stores (locations)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT,
  location_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can see own stores" ON stores FOR SELECT USING (EXISTS (SELECT 1 FROM merchants m WHERE m.id = merchant_id AND m.id = auth.uid()));
CREATE POLICY "Merchants can manage own stores" ON stores FOR ALL USING (EXISTS (SELECT 1 FROM merchants m WHERE m.id = merchant_id AND m.id = auth.uid()));

-- Attendants
CREATE TABLE attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  hashed_pin TEXT,
  access_level TEXT CHECK (access_level IN ('standard', 'manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE attendants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendants are managed by merchants" ON attendants FOR ALL USING (EXISTS (SELECT 1 FROM store_attendants sa JOIN stores s ON sa.store_id = s.id WHERE s.merchant_id = auth.uid()));

-- Store-Attendant junction
CREATE TABLE store_attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  attendant_id UUID NOT NULL REFERENCES attendants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, attendant_id)
);
ALTER TABLE store_attendants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants can manage store attendants" ON store_attendants FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Device registry for "device guard" (security layer)
CREATE TABLE device_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  device_fingerprint TEXT UNIQUE,
  is_trusted BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants manage device registry" ON device_registry FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT,
  sku TEXT,
  retail_price NUMERIC(12,2),
  wholesale_price NUMERIC(12,2),
  stock_quantity INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants manage own products" ON products FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  attendant_id UUID REFERENCES attendants(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_cash_float NUMERIC(12,2) DEFAULT 0,
  status TEXT CHECK (status IN ('open', 'clean', 'discrepancy_locked')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants manage own shifts" ON shifts FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Sales events / POS logs (modified to include shift_id)
CREATE TABLE sales_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  ticket_id TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER,
  price_at_sale NUMERIC(12,2),
  event_type TEXT CHECK (event_type IN ('SALE', 'VOID', 'ADJUSTMENT')),
  attendant_id UUID REFERENCES attendants(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sales_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants see own sales" ON sales_events FOR SELECT USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));
CREATE POLICY "Trusted devices can insert sales" ON sales_events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM device_registry dr WHERE dr.store_id = store_id AND dr.is_trusted));

-- Cash drawer logs (modified to reference shift_id)
CREATE TABLE cash_drawer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('OPENING', 'CLOSING', 'DROP')),
  expected_amount NUMERIC(12,2),
  actual_amount NUMERIC(12,2),
  discrepancy NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cash_drawer_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants see drawer logs" ON cash_drawer_logs FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Pending Transfers
CREATE TABLE pending_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  ticket_id TEXT,
  sale_id UUID REFERENCES sales_events(id) ON DELETE SET NULL,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'NGN',
  status TEXT CHECK (status IN ('initiated', 'confirmed', 'failed')) DEFAULT 'initiated',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
ALTER TABLE pending_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants manage pending transfers" ON pending_transfers FOR ALL USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));

-- Operational anomalies (for "invisible auditor")
CREATE TABLE operational_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  anomaly_type TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'critical')),
  payload TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE operational_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants see anomalies" ON operational_anomalies FOR SELECT USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = store_id AND s.merchant_id = auth.uid()));
