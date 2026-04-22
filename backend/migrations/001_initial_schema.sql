-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  student_id    VARCHAR(50) UNIQUE,
  phone         VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('student', 'delivery_partner', 'vendor', 'admin')),
  hostel        VARCHAR(100),
  room_number   VARCHAR(20),
  reward_points INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  expo_push_token VARCHAR(200),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- VENDORS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_name     VARCHAR(150) NOT NULL,
  description   TEXT,
  location      VARCHAR(200),
  image_url     VARCHAR(500),
  is_open       BOOLEAN DEFAULT false,
  is_approved   BOOLEAN DEFAULT false,
  rating        DECIMAL(2,1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id     UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  image_url     VARCHAR(500),
  category      VARCHAR(50) DEFAULT 'food',
  is_available  BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES users(id),
  vendor_id           UUID NOT NULL REFERENCES vendors(id),
  delivery_partner_id UUID REFERENCES users(id),
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','accepted','preparing','ready',
                                          'picked_up','delivered','cancelled')),
  delivery_address    VARCHAR(300) NOT NULL,
  special_note        TEXT,
  subtotal            DECIMAL(10,2) NOT NULL,
  delivery_fee        DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  commission          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount        DECIMAL(10,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id),
  name          VARCHAR(150) NOT NULL,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- REWARD TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reward_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points      INTEGER NOT NULL,
  reason      VARCHAR(100) NOT NULL,
  order_id    UUID REFERENCES orders(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID UNIQUE NOT NULL REFERENCES orders(id),
  student_id  UUID NOT NULL REFERENCES users(id),
  vendor_id   UUID NOT NULL REFERENCES vendors(id),
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_student    ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor     ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner    ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_vendor       ON menu_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user      ON reward_transactions(user_id);
