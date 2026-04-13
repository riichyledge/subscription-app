# SubApp — Production-Ready Subscription Starter

A full-stack subscription web app with JWT auth, 3-day free trial, and Stripe billing.

## Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React 18 + Vite             |
| Backend  | Node.js + Express           |
| Database | SQLite via Prisma ORM       |
| Auth     | JWT (jsonwebtoken + bcrypt) |
| Payments | Stripe Checkout             |

---

## Folder Structure

```
subscription-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # User model
│   ├── src/
│   │   ├── lib/prisma.js       # Prisma client singleton
│   │   ├── middleware/auth.js  # JWT verify + trial/access logic
│   │   └── routes/
│   │       ├── auth.js         # /api/auth/signup|login|me
│   │       ├── stripe.js       # /api/stripe/checkout|webhook|cancel
│   │       └── dashboard.js    # /api/dashboard (protected)
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── lib/api.js
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       ├── Landing.jsx
    │       ├── Login.jsx
    │       ├── Signup.jsx
    │       ├── Dashboard.jsx
    │       └── Subscribe.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A [Stripe](https://stripe.com) account

---

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-string"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
PORT=3001
FRONTEND_URL="http://localhost:5173"
```

#### How to get Stripe keys

1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** → `STRIPE_SECRET_KEY`
3. Create a product: **Products → Add product** → name it, set $15/month recurring
4. Copy the **Price ID** (starts with `price_`) → `STRIPE_PRICE_ID`

---

### 3. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

This creates `backend/prisma/dev.db` with the `User` table.

---

### 4. Set up Stripe webhook (local dev)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (via scoop)
scoop install stripe
```

Login and forward events to your local server:

```bash
stripe login
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy the **webhook signing secret** printed in the terminal → `STRIPE_WEBHOOK_SECRET`

---

### 5. Start the servers

Open two terminals:

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

App is live at **http://localhost:5173**

---

## How It Works

### Trial & Access Logic

```
User signs up → trialStartDate = NOW
   |
Dashboard access check:
   trialActive  = (now - trialStartDate) < 3 days  → ALLOW
   subscribed   = true                              → ALLOW
   otherwise                                        → REDIRECT to /subscribe
```

### Auth Flow

1. `POST /api/auth/signup` — hash password (bcrypt), create user, return JWT
2. `POST /api/auth/login`  — verify password, return JWT
3. JWT stored in `localStorage`, sent as `Authorization: Bearer <token>` header
4. `authenticate` middleware verifies token on every protected route

### Stripe Checkout Flow

```
User clicks "Subscribe"
  → POST /api/stripe/create-checkout-session
  → Redirected to Stripe hosted checkout
  → On success → redirected to /dashboard?subscribed=true
  → Stripe sends webhook → POST /api/stripe/webhook
  → User.subscribed = true, subscriptionStatus = "active"
```

### Webhook Events Handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `subscribed=true`, save subscription ID |
| `customer.subscription.updated` | Sync subscription status |
| `customer.subscription.deleted` | Set `subscribed=false`, status `canceled` |
| `invoice.payment_failed` | Set status `past_due` |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | JWT + access | Protected dashboard data |

### Stripe

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/stripe/create-checkout-session` | JWT | Create Stripe checkout |
| POST | `/api/stripe/webhook` | Stripe sig | Handle billing events |
| POST | `/api/stripe/cancel-subscription` | JWT | Cancel at period end |

---

## Production Deployment

1. Set `FRONTEND_URL` to your real domain in backend `.env`
2. Update Stripe webhook endpoint to `https://yourdomain.com/api/stripe/webhook`
3. Use a proper `DATABASE_URL` (PostgreSQL recommended) — just change the Prisma provider
4. Set `JWT_SECRET` to a cryptographically random 64-char string
5. Deploy to Railway, Render, or Fly.io

---

## Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- JWT expires after 7 days
- Stripe webhook signature verified on every request
- Helmet middleware sets security headers
- CORS restricted to `FRONTEND_URL` only
