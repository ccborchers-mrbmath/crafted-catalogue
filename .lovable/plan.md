
# Nailed It — Product Catalogue & Enquiry Site

A warm, rustic catalogue site for nailed-it.co.za: public browsing + product enquiries, plus an admin area for managing products, images, and enquiries. Full DB schema is built now (including orders/payments tables) so checkout can be layered on later without migrations.

## Visual direction

Warm & Rustic — palette `#2b1d14 / #7a4a2b / #c8a273 / #f4ead7`. Serif display (Fraunces) + clean sans body (Inter or DM Sans), generous whitespace, wood-grain texture accents, warm cream backgrounds, off-black text. All tokens live in `src/styles.css` as `oklch` under `@theme inline` — no hardcoded colors in components.

## Backend (Lovable Cloud)

Enable Lovable Cloud, then a single migration creates:

**Tables** (all money as integer cents, `GRANT`s + RLS in same migration):
- `products` — id, name, slug (unique), description, wood_type, dimensions, lead_time_days, is_active, created_at
- `product_variants` — id, product_id (FK cascade), name, price_cents int, currency default 'ZAR', sku, is_active
- `product_images` — id, product_id (FK cascade), storage_path, alt_text, sort_order
- `delivery_zones` — id, suburb, postal_code, is_serviceable, delivery_fee_cents
- `enquiries` — id, customer_name, email, phone, delivery_suburb, message, product_variant_id (nullable FK), status enum ('new'|'contacted'|'quoted'|'closed') default 'new', created_at
- `orders` — id, enquiry_id nullable, customer_name, email, phone, delivery_address, delivery_zone_id, subtotal_cents, delivery_fee_cents, total_cents, currency, status enum ('pending'|'paid'|'fulfilled'|'cancelled'), created_at
- `order_items` — id, order_id (FK cascade), product_variant_id, quantity, unit_price_cents
- `payments` — id, order_id (FK cascade), provider text, provider_reference, amount_cents, status, raw_payload jsonb

**Roles** — `app_role` enum + `user_roles` table + `has_role(uuid, app_role)` security-definer function (per user-roles rules). First signed-up user is NOT auto-admin; admin role granted manually via SQL/insert tool after the user signs up in-app.

**RLS**
- `products`, `product_variants`, `product_images`: `SELECT TO anon, authenticated USING (is_active)` (images join via product). Admin full access via `has_role`.
- `delivery_zones`: public SELECT.
- `enquiries`: `INSERT TO anon, authenticated` (with basic length checks), SELECT/UPDATE only for admin.
- `orders`, `order_items`, `payments`: admin-only.
- `user_roles`: authenticated SELECT own; admin manages.

**Storage** — public bucket `product-images` created via `supabase--storage_create_bucket`. RLS on `storage.objects`: public read, admin write/delete.

**Seed** — 3–4 products with 1 variant each and placeholder image records (generated hero/product images stored in the bucket).

## Frontend (TanStack Start routes)

- `/` **Home** — hero (wood-grain texture, brand promise, CTAs to Products/Contact), featured products strip (top 3 active), short about teaser, footer.
- `/products` **Listing** — grid of active products; filters: wood type, price range (from cheapest variant), search by name. URL-driven via `validateSearch`.
- `/products/$slug` **Detail** — image gallery, description, wood type, dimensions, lead time, variant picker (price shown as `R X,XXX.XX` formatted from cents), "Enquire about this" button opening the enquiry form pre-filled with the variant.
- `/about` — story, craftsmanship values, materials.
- `/contact` — general enquiry form (same schema, no product_variant_id) + placeholder contact details (email/phone/location TBD — clearly marked as placeholders in code with a `TODO` so you can swap them in).
- `/auth` — email/password sign-in for admin (no public sign-up UI surfaced; account created by whoever needs admin access, then granted role).
- `/_authenticated/admin` layout (integration-managed gate) with:
  - `/admin` dashboard — counts of new enquiries, active products.
  - `/admin/products` — table, create/edit/delete, toggle active.
  - `/admin/products/$id` — edit product + manage variants (add/edit/delete, price in rands input, stored as cents) + manage images (upload to storage, reorder, delete, alt text).
  - `/admin/enquiries` — list with status filter; row detail updates status.

## Enquiry submission

Public server function using the server publishable client (respects RLS as anon). Zod validation: name 1–100, email valid ≤255, phone 6–20, suburb 1–100, message 1–2000. On success: toast confirmation, form reset. No email notifications yet (can be added later).

## Money handling

- DB stores `price_cents` as integer only.
- Helper `formatZAR(cents)` → `R 1 299,00` (SA locale, `Intl.NumberFormat('en-ZA', { style:'currency', currency:'ZAR' })`).
- Admin price input takes rands, converted to cents on save (`Math.round(rands * 100)`).

## Technical details

- Data reads: `createServerFn` + `ensureQueryData`/`useSuspenseQuery` per Query pattern; admin fns use `requireSupabaseAuth` + `has_role` check.
- Image uploads: signed upload from admin using authenticated supabase client; store `storage_path`, render via `getPublicUrl`.
- Each route sets its own `head()` with title/description/OG. Detail page uses first product image as `og:image`.
- Admin sign-out follows sign-out hygiene (cancel queries → clear → signOut → navigate to `/auth`).
- Header shows sign-in state (admin link when signed-in admin, otherwise nothing customer-facing).

## Out of scope for this build

- Payment gateway integration (tables exist, no UI).
- Order creation UI (tables exist).
- Email notifications on new enquiry.
- Customer accounts.

After you approve, I'll enable Lovable Cloud, run the migration + storage bucket + seed, then build the UI.
