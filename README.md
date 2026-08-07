# Alleppey Pub ERP V3

This version upgrades the restaurant ERP from browser-only storage to a real
FastAPI database backend. Menu changes, orders, status updates and inventory
changes now use one REST API, while the frontend keeps a local cache so the demo
can still open when a free backend is waking up.

## What is connected

- Customer checkout creates orders through `POST /api/orders`
- Order management loads database orders and updates their status
- Menu management creates, edits and deletes database menu items
- Customer menu prices, descriptions and availability sync from the database
- Inventory management creates, edits, deletes and updates stock in the database
- SQLite works locally with no account or API key
- PostgreSQL works in deployment by setting `DATABASE_URL`

## Run on Windows

### 1. Start the backend

Double-click `RUN_AI.bat`, or run:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The first startup creates `backend/erp.db` and inserts ten menu items and eight
inventory items. Open `http://127.0.0.1:8000/docs` to view and test every API.

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/html/splash.html
```

Do not open the HTML using a `file:///` address. A local web server gives the
browser a consistent origin for API requests and navigation.

## Database modes

### Local development: ₹0

Do nothing. The backend automatically uses SQLite at `backend/erp.db`.

### Supabase PostgreSQL: free portfolio deployment

1. Create a Supabase project.
2. Copy its PostgreSQL connection string.
3. Set it as the backend environment variable named `DATABASE_URL`.
4. Restart the backend. The tables and starter records are created automatically.

Never put the database password in frontend JavaScript or commit a real `.env`
file to GitHub.

## Deploy the backend on Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variable: `DATABASE_URL=<your Supabase connection string>`

After deployment, edit `frontend/js/config.js` and replace the local URL with:

```javascript
window.PUB_API_BASE_URL = "https://YOUR-RENDER-SERVICE.onrender.com/api";
```

Deploy the `frontend` folder to Netlify afterward.

## Main API routes

| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/menu` | List or create menu items |
| PUT/DELETE | `/api/menu/{id}` | Edit or delete a menu item |
| GET/POST | `/api/inventory` | List or create inventory items |
| PUT/DELETE | `/api/inventory/{id}` | Edit or delete inventory |
| GET/POST | `/api/orders` | List or create orders |
| PATCH | `/api/orders/{id}/status` | Change order status |
| DELETE | `/api/orders/{id}` | Delete an order |
| POST | `/api/ai/analyse` | Generate rule-based business insights |

## Recommended test flow

1. Add products from the customer menu.
2. Complete checkout and place an order.
3. Open Order Management and change it from Pending to Preparing.
4. Refresh the page and confirm the status remains unchanged.
5. Open Inventory and update the stock quantity.
6. Open Menu Management, change a price and refresh the customer menu.

