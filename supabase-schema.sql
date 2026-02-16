-- ============================================
-- SCHEMA BASE DE DONNÉES — VISIONNAIRE OPTICIENS
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE product_category AS ENUM ('vue', 'soleil', 'ski', 'sport', 'enfant');
CREATE TYPE product_gender AS ENUM ('homme', 'femme', 'mixte', 'enfant');
CREATE TYPE lens_type AS ENUM ('unifocaux', 'progressifs', 'mi-distance', 'sans-correction');
CREATE TYPE order_status AS ENUM (
  'en_attente_paiement',
  'payee',
  'ordonnance_en_validation',
  'ordonnance_validee',
  'ordonnance_refusee',
  'en_fabrication',
  'expediee',
  'prete_en_boutique',
  'livree',
  'annulee'
);
CREATE TYPE delivery_method AS ENUM ('domicile', 'boutique');
CREATE TYPE payment_method AS ENUM ('stripe', 'alma');
CREATE TYPE appointment_status AS ENUM ('confirmee', 'annulee', 'terminee');
CREATE TYPE appointment_type AS ENUM ('examen_vue', 'essayage', 'ajustement', 'conseil');
CREATE TYPE user_role AS ENUM ('client', 'admin');

-- ============================================
-- PROFILES (extension de auth.users de Supabase)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADDRESSES
-- ============================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT, -- "Domicile", "Bureau", etc.
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  street TEXT NOT NULL,
  street_2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'France',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MARQUES
-- ============================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PRODUITS
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category product_category NOT NULL,
  gender product_gender NOT NULL DEFAULT 'mixte',
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  -- Caractéristiques
  frame_shape TEXT, -- rond, carré, aviateur, papillon, etc.
  frame_material TEXT, -- métal, acétate, titane, etc.
  frame_color TEXT,
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- VARIANTES PRODUITS (couleurs/tailles)
-- ============================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  color_name TEXT NOT NULL,
  color_hex TEXT, -- code couleur pour affichage
  size TEXT, -- S, M, L ou taille en mm
  price_override DECIMAL(10,2), -- si différent du prix de base
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- IMAGES PRODUITS
-- ============================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- OPTIONS DE VERRES
-- ============================================

CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Anti-reflet", "Photochromique", etc.
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'type', 'traitement', 'amincissement'
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PANIERS
-- ============================================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- pour les visiteurs non connectés
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  -- Options verres (si lunettes de vue)
  lens_type lens_type,
  prescription_url TEXT, -- URL vers l'ordonnance uploadée
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Options de verres sélectionnées pour un article du panier
CREATE TABLE cart_item_lens_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_item_id UUID NOT NULL REFERENCES cart_items(id) ON DELETE CASCADE,
  lens_option_id UUID NOT NULL REFERENCES lens_options(id) ON DELETE CASCADE,
  UNIQUE(cart_item_id, lens_option_id)
);

-- ============================================
-- COMMANDES
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE, -- VO-2024-001
  profile_id UUID NOT NULL REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'en_attente_paiement',
  delivery_method delivery_method NOT NULL,
  payment_method payment_method NOT NULL,
  -- Montants
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  promo_code TEXT,
  -- Paiement
  stripe_payment_intent_id TEXT,
  alma_payment_id TEXT,
  -- Entreprise (optionnel)
  company_name TEXT,
  company_siret TEXT,
  -- Coordonnées client (pour retrait boutique)
  client_phone TEXT,
  -- Adresse de livraison (snapshot)
  shipping_first_name TEXT,
  shipping_last_name TEXT,
  shipping_street TEXT,
  shipping_street_2 TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT DEFAULT 'France',
  -- Adresse de facturation (optionnel, si différente)
  billing_first_name TEXT,
  billing_last_name TEXT,
  billing_street TEXT,
  billing_street_2 TEXT,
  billing_city TEXT,
  billing_postal_code TEXT,
  billing_country TEXT DEFAULT 'France',
  -- Suivi
  tracking_number TEXT,
  notes TEXT, -- notes internes de l'opticien
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL, -- snapshot
  variant_info TEXT, -- snapshot couleur/taille
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  -- Verres
  lens_type lens_type,
  lens_options_summary TEXT, -- snapshot des options choisies
  lens_options_price DECIMAL(10,2) DEFAULT 0,
  prescription_url TEXT,
  prescription_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HISTORIQUE DES STATUTS DE COMMANDE
-- ============================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RENDEZ-VOUS
-- ============================================

CREATE TABLE appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, start_time)
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES appointment_slots(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  type appointment_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmee',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BLOG
-- ============================================

CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES profiles(id),
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTENU DU SITE (bannières, textes page d'accueil)
-- ============================================

CREATE TABLE site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE, -- 'hero_title', 'hero_subtitle', 'hero_image', etc.
  value TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'html'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROMOTIONS
-- ============================================

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  code TEXT UNIQUE, -- code promo si applicable
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  min_order_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_orders_profile ON orders(profile_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_appointments_slot ON appointments(slot_id);
CREATE INDEX idx_appointments_profile ON appointments(profile_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX idx_brands_slug ON brands(slug);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Profiles : chacun voit le sien, admin voit tout
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- NOTE: Pour la policy admin, utiliser une fonction SECURITY DEFINER pour eviter la recursion infinie
-- Executer dans le SQL Editor de Supabase :
-- CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
--   SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
-- $$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
-- DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
-- CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Addresses : chacun les siennes
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL USING (profile_id = auth.uid());

-- Orders : chacun les siennes, admin voit tout
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Users can update own order status" ON orders FOR UPDATE 
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin can manage all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order items : via la commande
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.profile_id = auth.uid())
);
CREATE POLICY "Users can create own order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.profile_id = auth.uid())
);
CREATE POLICY "Admin can manage all order items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order status history : via la commande
CREATE POLICY "Users can view own order history" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.profile_id = auth.uid())
);
CREATE POLICY "Users can create order history" ON order_status_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.profile_id = auth.uid())
);
CREATE POLICY "Admin can manage order history" ON order_status_history FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Carts : chacun le sien
CREATE POLICY "Users can manage own cart" ON carts FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Cart items via cart" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.profile_id = auth.uid())
);

-- Appointments : chacun les siens, admin voit tout
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admin can manage all appointments" ON appointments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tables publiques (lecture seule pour tous)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Public read images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read lens options" ON lens_options FOR SELECT USING (true);
CREATE POLICY "Public read published posts" ON blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true);
CREATE POLICY "Public read available slots" ON appointment_slots FOR SELECT USING (is_available = true);
CREATE POLICY "Public read active promotions" ON promotions FOR SELECT USING (is_active = true);

-- Admin peut tout faire sur les tables publiques
CREATE POLICY "Admin manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage variants" ON product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage images" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage brands" ON brands FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage lens options" ON lens_options FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage blog posts" ON blog_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage site content" ON site_content FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage slots" ON appointment_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin manage promotions" ON promotions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- FUNCTION : Créer le profil après inscription
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'client'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION : Mettre à jour updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
