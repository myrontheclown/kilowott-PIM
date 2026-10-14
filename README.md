# CatalogSync — Enterprise Product Information Management (PIM) for WooCommerce

CatalogSync is a modern, high-performance Product Information Management (PIM) system built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It is designed to centralize product data, enforce category-specific attribute schemas, calculate real-time completeness scores, and synchronize approved catalog changes with WooCommerce via its official REST API v3.

---

## 🚀 Key Features

### 1. Dual Operational Modes
- **Demo Sandbox Mode:** Uses rich sample products across Clothing, Electronics, Home Goods, and Beauty with browser persistence and simulated network synchronization. All sync outputs are explicitly badged as **Simulated**.
- **WooCommerce Live Mode:** Connects to genuine WooCommerce stores using the official REST API v3 via secure, server-side Next.js route handlers. Never claims synchronization succeeded unless confirmed by the remote API.

### 2. Flexible Category-Specific Attributes
- Enforces distinct attribute schemas per product category:
  - **Clothing & Apparel:** Brand, Size, Color, Material, Gender.
  - **Consumer Electronics:** Brand, Warranty, Connectivity, Battery Life, Model Number.
  - **Home & Living:** Primary Material, Dimensions, Color Finish, Care Instructions, Weight.
  - **Beauty & Personal Care:** Brand, Volume, Active Ingredients, Skin Type.
- Supports adding, modifying, and removing custom attribute key-value pairs per product or at the category schema level.

### 3. Real-Time Completeness Scoring & Publish Guard
- Evaluates core product metadata alongside category-specific attribute requirements.
- Dynamic scoring algorithm (0–100%) recalculates on every keystroke.
- **Publish Guard:** Prevents moving products to `published` status if mandatory fields or category-required attributes are missing.

### 4. Synchronization Center & Audit Trail
- Dedicated dashboard tracking pending, synced, simulated, and failed synchronizations.
- One-click batch sync or granular per-product sync with retry mechanics.
- In-depth error inspection modal displaying exact HTTP error messages and remote payloads.
- Integration diagnostics tool to test WooCommerce store connectivity.

### 5. DummyJSON Demo Seeding
- One-click sample import directly from DummyJSON with automatic categorization and attribute enrichment. Includes an offline fallback to ensure reliable demos.

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router with Partial Prerendering)
- **Language:** TypeScript 5 (Strict typing)
- **Styling:** Tailwind CSS v4 (SaaS administration theme: Slate & Indigo)
- **Icons:** `lucide-react`
- **Validation:** `zod`
- **API Integration:** WooCommerce REST API v3 (Server-side route handlers)
- **Testing:** Native Node.js test runner with `tsx`

---

## 📁 Project Architecture

```
src/
├── app/
│   ├── page.tsx                     # Overview Dashboard
│   ├── products/
│   │   ├── page.tsx                 # Product Catalog & Filters
│   │   ├── new/page.tsx             # Product Creator
│   │   └── [id]/page.tsx            # Product Detail & Editor
│   ├── attributes/page.tsx          # Category Schema Manager
│   ├── sync/page.tsx                # Synchronization Center & Logs
│   ├── settings/page.tsx            # Mode Switcher & WC Credentials
│   └── api/woocommerce/
│       ├── test/route.ts            # Server-side Connection Test
│       ├── products/route.ts        # List & Create Remote Products
│       └── products/[id]/route.ts   # Update Remote Product by ID
├── components/
│   ├── layout/                      # Sidebar, Header, AppShell
│   ├── dashboard/                   # MetricsCards, CompletenessChart, RecentSyncActivity
│   └── products/                    # ProductTable, ProductForm, FilterBar, Badges, Modals
├── context/
│   └── CatalogContext.tsx           # Global state, persistence & provider abstraction
├── lib/
│   ├── providers/                   # DemoProvider & WooCommerceProvider
│   ├── completeness.ts              # Completeness score & publish eligibility engine
│   ├── default-rules.ts             # Initial category schemas
│   ├── dummyjson.ts                 # DummyJSON importer with offline fallback
│   ├── product-mapper.ts            # Bidirectional WC & DummyJSON mappers
│   ├── validation.ts                # Zod schemas
│   └── woocommerce.ts               # Server-side REST API client
└── types/
    └── product.ts                   # Core TypeScript domain models
```

---

## 🏃 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🎯 5-Minute Hackathon Demo Script

1. **Overview Dashboard (`/`):**
   - Point out real-time derived metrics (Total, Incomplete Data, Pending Sync, Failed Sync).
   - Review the **Catalog Completeness Health** chart showing category breakdowns.
   - Point out the active **Demo Sandbox** badge and recent audit trail.

2. **Product Catalog (`/products`):**
   - Filter by Category (e.g., Clothing, Electronics) and Sync Status.
   - Hover over the **Completeness Badge** for an incomplete product (e.g. *Raw Selvedge Denim Jacket*) to inspect the missing attribute tooltip (*Color*, *Material*).

3. **Dynamic Attribute Editing & Validation Guard (`/products/[id]` or `/products/new`):**
   - Click to edit the denim jacket.
   - Notice the completeness score is incomplete.
   - Try clicking **Publish Product** — observe the validation warning preventing incomplete publication.
   - Fill in **Color** (`Indigo Raw`) and **Material** (`100% Selvedge Cotton`).
   - Watch the score instantly update to 100%! The **Publish Product** button unlocks.
   - Add a custom key-value attribute (e.g. `mill: Kuroki Mills`) to show flexible schema support.

4. **Category Schema Manager (`/attributes`):**
   - Switch between categories (Clothing, Electronics, Home Goods, Beauty).
   - Toggle an attribute requirement or add a new attribute definition (e.g. `Care Instructions`).
   - Notice how all products in the category instantly re-evaluate their completeness scores.

5. **Sync Center & Retry Flow (`/sync`):**
   - Observe the pending and failed products.
   - Click the failed sync item (*Mechanical Ergo Split Keyboard*) to inspect the exact simulated remote error details.
   - Click **Retry** or **Sync All Pending** to observe real-time progress and audit log generation.
   - Click **Test Connection** to demonstrate live diagnostic reporting.
