# Budget & Debt Tracker

A full-stack personal finance management application built with Django REST API and React.

## Tech Stack

- **Backend:** Python 3.11+, Django 5, Django REST Framework, SQLite (dev) / PostgreSQL (prod)
- **Frontend:** React 18, Vite, Tailwind CSS, Chart.js, Lucide React
- **Auth:** JWT (djangorestframework-simplejwt)

## Features

- Dashboard with income, expenses, net balance, debt, savings summary cards and charts
- Transaction management (income/expense) with category and account tracking
- Bank accounts, digital wallets, credit cards, cash tracking with transfers
- Debt management with payment history and auto-balance updates
- Savings goals with deposit/withdraw tracking and progress bars
- Recurring bills with "Mark as Paid" and upcoming reminders
- Reports & analytics with monthly summaries and CSV export
- Dark mode support
- Responsive sidebar navigation

## Project Structure

```
budget-app/
├── backend/          Django REST API
│   ├── budget_api/   Project settings
│   ├── apps/         Apps: users, accounts, categories, transactions, debts, savings, recurring
│   └── manage.py
├── frontend/         React SPA
│   ├── src/
│   │   ├── pages/    Dashboard, Transactions, Accounts, Debts, Savings, Recurring, Reports
│   │   ├── components/
│   │   ├── context/  Auth & Theme providers
│   │   └── api/      Axios client with JWT interceptors
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env if needed (defaults work for local dev)

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

### 3. Seed Default Data

After creating a user via the frontend register page or Django admin:

```bash
cd backend
python manage.py seed_defaults --email=user@example.com
```

This creates default categories (Salary, Food, Rent, Utilities, etc.) and sample accounts (BDO, GCash, Cash).

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register/` | Register new user |
| `POST /api/auth/login/` | Login (returns JWT) |
| `POST /api/auth/refresh/` | Refresh access token |
| `GET /api/auth/me/` | Current user profile |
| `GET /api/accounts/` | CRUD money sources |
| `GET /api/categories/` | CRUD transaction categories |
| `GET /api/transactions/` | CRUD transactions + filters |
| `GET /api/debts/` | CRUD debts + payments |
| `GET /api/savings/` | CRUD savings goals |
| `GET /api/recurring/` | CRUD recurring bills |

## Data Migration from Old App

1. Open your old budget tracker in the browser.
2. Go to **Settings → Export JSON** and save the file.
3. In the new app, after registering and logging in, you can manually add the data or write a script to import it via the API.

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
```

For PostgreSQL production, uncomment the PostgreSQL database config in `settings.py` and set:

```env
DB_NAME=budget_db
DB_USER=budget_user
DB_PASSWORD=secure-password
DB_HOST=localhost
DB_PORT=5432
```

## License

MIT
