-- ============================================================
--  🛒 SHOPIFY CLONE — MySQL Database Schema
--  Run this file ONCE to set up your entire database
-- ============================================================

-- Step 1: Create and use the database
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- ============================================================
-- TABLE: users
-- Stores everyone who registers on the site
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150)        NOT NULL UNIQUE,
  password      VARCHAR(255)        NOT NULL,        -- stored as bcrypt hash
  role          ENUM('user','admin') DEFAULT 'user',
  created_at    TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: categories
-- E.g. Electronics, Clothing, Books …
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================================
-- TABLE: products
-- Every item sold on the store
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200)       NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2)      NOT NULL,
  stock        INT                DEFAULT 0,
  image_url    VARCHAR(500),
  category_id  INT,
  created_at   TIMESTAMP          DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: cart
-- Each row = one product in one user's cart
-- ============================================================
CREATE TABLE IF NOT EXISTS cart (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT DEFAULT 1,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- ============================================================
-- TABLE: orders
-- One row per placed order (the "header")
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NOT NULL,
  total            DECIMAL(10,2)  NOT NULL,
  status           ENUM('pending','processing','shipped','delivered','cancelled')
                   DEFAULT 'pending',
  shipping_name    VARCHAR(100),
  shipping_address TEXT,
  shipping_city    VARCHAR(100),
  shipping_zip     VARCHAR(20),
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: order_items
-- Each line inside an order
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT            NOT NULL,
  product_id  INT            NOT NULL,
  quantity    INT            NOT NULL,
  price       DECIMAL(10,2)  NOT NULL,   -- price AT time of purchase
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA — Sample categories & products so you see something
-- ============================================================
INSERT IGNORE INTO categories (name) VALUES
  ('Electronics'),
  ('Clothing'),
  ('Books'),
  ('Home & Garden'),
  ('Sports');

INSERT IGNORE INTO products (name, description, price, stock, image_url, category_id) VALUES
  ('Wireless Noise-Cancelling Headphones',
   'Premium audio experience with 40-hour battery life and adaptive noise cancellation.',
   149.99, 50,
   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
   1),

  ('Mechanical Gaming Keyboard',
   'RGB backlit mechanical keyboard with blue switches and aluminium frame.',
   89.99, 30,
   'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600',
   1),

  ('4K Ultra-HD Smart TV — 55"',
   'Crisp 4K display with built-in streaming, Dolby Vision, and voice control.',
   599.99, 15,
   'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600',
   1),

  ('Classic Slim-Fit Denim Jacket',
   'Timeless denim jacket in a modern slim cut. Available in indigo wash.',
   59.99, 100,
   'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600',
   2),

  ('Running Shoes — Aero Series',
   'Lightweight performance running shoes with responsive cushioning.',
   119.99, 75,
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
   5),

  ('The Art of Clean Code',
   'A practical guide to writing readable, maintainable software.',
   34.99, 200,
   'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
   3),

  ('Stainless Steel Water Bottle — 1L',
   'Double-wall insulated bottle keeps drinks cold 24h or hot 12h.',
   24.99, 150,
   'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600',
   4),

  ('Yoga Mat — Non-Slip Pro',
   'Extra-thick 6mm non-slip mat with carrying strap and alignment lines.',
   44.99, 80,
   'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
   5),

  ('Portable Bluetooth Speaker',
   'Waterproof 360° sound with 20-hour battery. Perfect for outdoors.',
   79.99, 60,
   'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
   1),

  ('Ceramic Pour-Over Coffee Set',
   'Handcrafted ceramic dripper, carafe, and two cups. Makes 600ml.',
   54.99, 40,
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
   4);