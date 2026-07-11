# AnQ Movers Frontend

React + Vite + Tailwind frontend for the AnQ Movers backend.

## Included

- Customer login, register, dashboard, moves, quotes, messages, payments, documents, profile, support
- Vendor login, register, dashboard, leads, assigned jobs, quote submission, messages, documents, profile
- Admin login, dashboard, jobs, customers, vendors, assignments, payments, messages, analytics, audit logs, settings
- API integration for the Express + Sequelize backend previously generated
- Professional dashboard UI matching the submitted Customer, Vendor and Admin references
- Fixed full-screen dashboard layout with internal table/card scrolling

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Default API URL:

```bash
VITE_API_BASE_URL=http://localhost:7070/api
```

Start the backend first, then login using backend-created users.

Seeded admin from backend:

```txt
email: admin@anqmovers.com
password: Admin@12345
```

Customer and vendor accounts can be created from the login screen. Vendor login requires admin verification after registration.

## Build check

```bash
npm run build
```
# AnQ-Dashboard
