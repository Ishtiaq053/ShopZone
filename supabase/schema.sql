-- ══════════════════════════════════════════════════════════════════════════════
-- ShopZone — Supabase PostgreSQL Schema
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Enable pgcrypto for gen_random_uuid() ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    email      TEXT        UNIQUE NOT NULL,
    password   TEXT        NOT NULL,
    role       TEXT        NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. products ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT        NOT NULL,
    price            NUMERIC     NOT NULL,
    description      TEXT        NOT NULL DEFAULT '',
    category         TEXT        NOT NULL,
    stock            INT         NOT NULL DEFAULT 0,
    image            TEXT        NOT NULL DEFAULT '',
    featured         BOOLEAN     NOT NULL DEFAULT false,
    rating           NUMERIC     NOT NULL DEFAULT 4,
    brand            TEXT        NOT NULL DEFAULT '',
    is_on_sale       BOOLEAN     NOT NULL DEFAULT false,
    discount_percent NUMERIC     NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 3. orders ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    products     JSONB       NOT NULL,
    total_amount NUMERIC     NOT NULL,
    status       TEXT        NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Session table for connect-pg-simple ───────────────────────────────────────
-- (connect-pg-simple will auto-create this, but you can pre-create it too)
CREATE TABLE IF NOT EXISTS session (
    sid    TEXT        PRIMARY KEY,
    sess   JSONB       NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

-- ══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- Supabase enables RLS by default. Because ShopZone is a server-side Express
-- app that uses the anon key for ALL queries, we grant full access to anon.
-- Access control is enforced by Express middleware (isLoggedIn, isAdmin),
-- not by RLS, so this is the correct approach for a traditional web app.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── users ────────────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_users" ON users;
CREATE POLICY "anon_all_users" ON users
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── products ─────────────────────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_products" ON products;
CREATE POLICY "anon_all_products" ON products
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── orders ───────────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_orders" ON orders;
CREATE POLICY "anon_all_orders" ON orders
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── session ───────────────────────────────────────────────────────────────────
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_session" ON session;
CREATE POLICY "anon_all_session" ON session
    FOR ALL TO anon USING (true) WITH CHECK (true);

