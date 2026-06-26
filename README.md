# 🛒 LUXE STORE — Full-Stack E-Commerce Platform

> A production-ready e-commerce web application built with **Node.js**, **Express**, **MySQL**, and vanilla **HTML/CSS/JS** — featuring JWT authentication, role-based access control, a shopping cart, transactional checkout, and live order tracking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://fanciful-crostata-aca859.netlify.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://ecommerce-backend-62s2.onrender.com/api)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 📸 Screenshots

> Home page · Product listing with search & filter · Cart · Checkout · Order history

---

## ✨ Features

### 👤 Authentication & Security
- User registration with bcrypt password hashing (12 salt rounds)
- JWT-based login with 7-day token expiry
- Protected routes via `Authorization: Bearer <token>` middleware
- Role-based access control — `user` and `admin` roles
- Input validation on all auth endpoints via `express-validator`

### 🛍️ Product Catalogue
- Browse all products with real-time search (by name & description)
- Filter by category, sort by price (asc/desc), newest, or name
- Server-side pagination (`page` + `limit` query params)
- Product detail page with stock availability

### 🛒 Shopping Cart
- Add, update quantity, remove items, or clear the entire cart
- Real-time total calculation on the server
- Duplicate item detection — increments quantity automatically
- Stock validation before adding to cart

### 📦 Orders & Checkout
- Full transactional checkout with MySQL `BEGIN / COMMIT / ROLLBACK`
- Stock level decremented atomically on order placement
- Cart cleared automatically after successful order
- Order history with item count, status, and full detail view
- Admin can update order status: `pending → processing → shipped → delivered → cancelled`

### 🎨 Frontend
- Responsive single-page experience across 7 HTML pages
- Toast notification system (success / error / info)
- Cart item count badge in the navbar
- Hero section, filters bar, and product grid on the homepage

---

## 🏗️ Project Structure

```
ecommerce/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool (mysql2/promise)
│   ├── middleware/
│   │   └── auth.js            # JWT protect + adminOnly guards
│   ├── routes/
│   │   ├── auth.js            # Register / Login / Me
│   │   ├── products.js        # CRUD + search + pagination
│   │   ├── cart.js            # Full cart management
│   │   └── orders.js          # Checkout + order history
│   ├── .env                   # Environment variables (not committed)
│   ├── package.json
│   └── server.js              # Express app entry point
│
├── database/
│   └── schema.sql             # Full DB schema + seed data
│
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── api.js             # Shared API client + UI utilities
    ├── index.html             # Home / product listing
    ├── product.html           # Single product detail
    ├── cart.html              # Shopping cart
    ├── checkout.html          # Place order
    ├── orders.html            # Order history
    ├── login.html
    └── register.html
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/muhammadahmadbajwa811-collab/ecommerce.git
cd ecommerce
```

### 2. Set up the database

```sql
CREATE DATABASE ecommerce_db;
USE ecommerce_db;
```

Then run the schema (includes seed data for categories and 10 sample products):

```bash
mysql -u root -p ecommerce_db < database/schema.sql
```

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env   # or create .env manually
```

Populate `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_db
DB_PORT=3306
JWT_SECRET=a_long_random_secret_string
PORT=5000
CLIENT_URL=http://127.0.0.1:5500
```

### 4. Install dependencies & start the backend

```bash
cd backend
npm install
npm run dev       # development (nodemon)
# or
npm start         # production
```

The API will be live at `http://localhost:5000`.

### 5. Run the frontend

Open `frontend/index.html` in your browser via a local server (e.g., VS Code Live Server on port 5500), or simply open the file directly.

> **Note:** `frontend/js/api.js` points to the deployed Render backend by default. For local development, change `API_URL` to `http://localhost:5000/api`.

---

## 🔌 API Reference

Base URL: `https://ecommerce-backend-62s2.onrender.com/api`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Create account → returns JWT |
| `POST` | `/auth/login` | ❌ | Login → returns JWT |
| `GET` | `/auth/me` | ✅ | Get current user profile |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/products` | ❌ | List all (supports `?search=`, `?category=`, `?sort=`, `?page=`, `?limit=`) |
| `GET` | `/products/:id` | ❌ | Single product |
| `GET` | `/products/categories` | ❌ | All categories |
| `POST` | `/products` | 🔐 Admin | Create product |
| `PUT` | `/products/:id` | 🔐 Admin | Update product |
| `DELETE` | `/products/:id` | 🔐 Admin | Delete product |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/cart` | ✅ | View cart + total |
| `POST` | `/cart` | ✅ | Add item `{ product_id, quantity }` |
| `PUT` | `/cart/:id` | ✅ | Update item quantity |
| `DELETE` | `/cart/:id` | ✅ | Remove single item |
| `DELETE` | `/cart` | ✅ | Clear entire cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/orders` | ✅ | Place order (checkout) |
| `GET` | `/orders` | ✅ | My order history |
| `GET` | `/orders/:id` | ✅ | Single order detail |
| `PUT` | `/orders/:id/status` | 🔐 Admin | Update order status |

**Request headers for protected routes:**
```
Authorization: Bearer <your_jwt_token>
```

---

## 🗄️ Database Schema

```
users           → id, name, email, password (bcrypt), role, created_at
categories      → id, name
products        → id, name, description, price, stock, image_url, category_id, created_at
cart            → id, user_id, product_id, quantity  [UNIQUE: user_id + product_id]
orders          → id, user_id, total, status, shipping fields, created_at
order_items     → id, order_id, product_id, quantity, price (snapshot at purchase time)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18 |
| Framework | Express 4 |
| Database | MySQL 8 (mysql2/promise) |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Validation | express-validator |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (ES6+) |
| Dev Tools | nodemon, dotenv |
| Backend Hosting | Render |
| Frontend Hosting | Netlify |

---

## 🚢 Deployment

### Backend → Render

1. Push `backend/` to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set build command: `npm install` — start command: `npm start`.
4. Add all environment variables from `.env` in the Render dashboard.

### Frontend → Netlify

1. Push `frontend/` to GitHub.
2. Import the repo on [Netlify](https://netlify.com) — set publish directory to `frontend/`.
3. Ensure `API_URL` in `js/api.js` points to your Render backend URL.

### Database → FreeSQLDatabase / PlanetScale / Railway

Use any hosted MySQL provider and populate the environment variables accordingly.

---

## 🔒 Security Notes

- Passwords are **never stored in plaintext** — bcrypt with 12 rounds is used.
- JWT secrets must be long, random, and **never committed to version control**.
- All admin routes are double-gated: `protect` (valid JWT) + `adminOnly` (role check).
- SQL queries use **parameterised statements** (`?` placeholders) throughout — no raw string interpolation.
- Checkout runs inside a **database transaction** — partial failures roll back automatically.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 👨‍💻 Author

**Muhammad Ahmad Bajwa**  
CS Student @ UET Lahore 
[GitHub](https://github.com/muhammadahmadbajwa811-collab)

---


