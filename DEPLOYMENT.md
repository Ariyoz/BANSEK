# BANSEK Pure Water — Deployment Guide

## Website Structure

```
bansekwater.com/          ← Customer website  (index.html)
bansekwater.com/admin/    ← Admin dashboard   (admin/index.html)
```

The `/admin` route is handled automatically by the folder structure.
No special server configuration is needed beyond what is included.

---

## How to Deploy

### Option 1 — Netlify (Recommended, Free)

1. Go to https://netlify.com and create a free account
2. Click **"Add new site" → "Deploy manually"**
3. Drag and drop the entire **BANSEK** project folder
4. Netlify gives you a URL like `https://bansek.netlify.app`
5. To use your own domain (`www.bansekwater.com`):
   - Go to **Site settings → Domain management**
   - Click **"Add custom domain"** and follow the steps
   - Update your domain's DNS nameservers to point to Netlify

The `_redirects` file is already included and handles `/admin` routing.

---

### Option 2 — Vercel (Free)

1. Go to https://vercel.com and create a free account
2. Click **"Add New → Project"**
3. Import your project folder or connect your GitHub repo
4. Deploy — Vercel handles everything automatically

The `vercel.json` file is already included and handles `/admin` routing.

---

### Option 3 — cPanel / Shared Hosting (e.g. Namecheap, GoDaddy)

1. Log in to your hosting control panel (cPanel)
2. Open **File Manager** and navigate to `public_html`
3. Upload all project files — the folder structure must be:
   ```
   public_html/
   ├── index.html
   ├── order.html
   ├── products.html
   ├── faq.html
   ├── css/
   ├── js/
   ├── admin/
   │   ├── index.html       ← Login page
   │   ├── dashboard.html   ← Dashboard
   │   └── css/
   └── .htaccess            ← Already included
   ```
4. The `.htaccess` file is already included and handles routing

---

## Admin Access

| URL | Purpose |
|-----|---------|
| `www.bansekwater.com` | Customer website |
| `www.bansekwater.com/admin/` | Admin login |
| `www.bansekwater.com/admin/dashboard.html` | Admin dashboard |

### Default Login Credentials

| Field | Value |
|-------|-------|
| Username | `bansek_admin` |
| Password | `bansek2026` |

**⚠️ IMPORTANT: Change these before going live!**

Open `admin/index.html` and update lines 35–36:
```javascript
const ADMIN_USER = 'your_new_username';
const ADMIN_PASS = 'your_new_strong_password';
```

Use a strong password — at least 12 characters with numbers and symbols.

---

## How Orders Flow

```
Customer fills order form
        ↓
Order saved to browser localStorage
        ↓
WhatsApp opens with full order details → Company phone receives notification
        ↓
Admin opens dashboard.bansekwater.com/admin/
        ↓
Order appears in dashboard with all details
        ↓
Staff updates status: Pending → Confirmed → Delivered
```

---

## WhatsApp Number

Open `js/main.js` and update line 8:
```javascript
const WHATSAPP_NUMBER = '2348012345678'; // Replace with real number
```

Format: country code + number, no `+` or spaces.
Nigeria example: `08012345678` → `2348012345678`

---

## Important Notes

- Orders are stored in **browser localStorage** on the customer's device
- The admin dashboard reads from the **same browser's localStorage**
- This means: the admin must use the **same browser and device** that customers order from,
  OR you need to upgrade to a backend database (Firebase, Supabase, etc.) for multi-device sync
- For a small local business, this works perfectly — orders also arrive via WhatsApp as backup
- For a larger operation, contact a developer to add a real database backend

---

## File Summary

| File | Purpose |
|------|---------|
| `index.html` | Customer homepage |
| `products.html` | Products page |
| `order.html` | Order form |
| `faq.html` | FAQ page |
| `css/style.css` | Customer site styles |
| `js/main.js` | Order logic + WhatsApp + localStorage |
| `admin/index.html` | Admin login page |
| `admin/dashboard.html` | Admin order dashboard |
| `admin/css/login.css` | Login page styles |
| `admin/css/dashboard.css` | Dashboard styles |
| `.htaccess` | Apache server routing |
| `_redirects` | Netlify routing |
| `vercel.json` | Vercel routing |
