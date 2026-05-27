# SmartCart — App Context

## Core Concept
- Loyalty points app for supermarket shoppers
- Revenue model: B2B analytics — aggregated purchase data sold to brands and supermarkets
- Points cycle: Discover → Scan → Validate → Accumulate → Redeem
- Points accrue only when: user is inside affiliated store AND purchase is validated via QR at POS

## Actors
- **User/Consumer**: Shopper operating the app
- **Cashier**: Scans QR at checkout to validate purchase
- **POS System**: Supermarket point-of-sale; confirms product purchase to SmartCart backend
- **Brand**: Sponsors products; pays for point rewards and purchases analytics data
- **Supermarket**: Affiliated store chain; provides location signals and POS integration
- **SmartCart Backend**: Central platform; manages sessions, points, analytics pipeline

---

## Screens

### Screen 1: Main — Empty State (`pantalla-1-main-vacio.html`)
- Entry point when user arrives at store
- Location indicator: auto-detects affiliated store via GPS/BLE beacons; required to enable point accumulation
- Points card: current total, progress bar to next reward, motivational subtitle
- Primary CTA: "Escanear producto"
- Empty state card: dashed border, no products scanned yet
- Carousel "Productos con puntos hoy": sponsored products with name, brand, price, points offered
- Bottom nav: Home | Scan | Rewards | Profile

### Screen 2: Camera Scanning (`pantalla-2-escanear.html`)
- Accessed via primary CTA from main
- Live camera feed, full screen
- Scan frame: green corners, guides barcode alignment
- Animated scan line: signals active processing
- Top instruction: "Apunta al código de barras"
- Location pill: confirms user is inside store, scan valid
- Secondary action: manual barcode entry (fallback for damaged barcodes)
- Top buttons: Close (→ main), Flash toggle

### Screen 3: Main — 1 Product Scanned (`pantalla-3-main-1producto.html`)
- State after first successful scan; user stays in main flow
- Toast: green banner, product name + pending points (e.g. "+15 pts pendientes")
- Points card: shows "+15 Pendientes" subsection
- Primary CTA changes to: "Escanear otro producto"
- Scanned products section: dynamic, counter ("1 producto")
- Product card: icon, name, brand, price, yellow pending-points tag; newest item = green highlight + "Nuevo" label
- Delete button (red X): removes product before validation

### Screen 4: Main — Multiple Products (`pantalla-4-main-3productos.html`)
- State when session has 2+ products and user is ready to check out
- Toast: most recently scanned product
- Points card: total pending sum (e.g. "+33 Pendientes")
- Dual CTAs:
  - "Escanear otro" (secondary, green border): continue adding products
  - "Generar QR de salida" (primary, solid green, visually dominant): proceed to checkout
- Full product list: each entry shows price, pending points, delete option
- "Nuevo" label persists on most recently added item

### Screen 5: QR Validation (`pantalla-5-qr-validacion.html`)
- Last in-app step before leaving store
- Full green screen: high visibility for cashier to identify
- Instruction: "Muéstrale este código a la cajera"
- QR code: large, centered; alphanumeric code below as fallback (e.g. "SC-2026-AX9K-7283")
- Validity: 10 minutes; expires to prevent post-purchase fraud
- Transaction summary: pending product count + total points to be validated
- Status message: "Esperando validación de la cajera..." while polling POS

### Screen 6: Confirmation (`pantalla-6-confirmacion.html`)
- Triggered automatically when POS confirms purchase
- Hero: full green with large checkmark
- Primary text: "Puntos acreditados" / "Tu compra fue verificada en caja"
- Points earned card: points this session (+33), new total (153 pts), updated progress bar, deficit to next reward
- Validated products list: each product with green check, icon, name, points credited
- Total purchased: sum of validated sponsored products only
- CTAs:
  - "Volver al inicio" → main empty state (new session)
  - "Ver mis recompensas" → rewards catalog

### Screen 7: My Rewards (`pantalla-7-recompensas.html`)
- Closes the loyalty loop; points → discount coupons
- Points balance card: green header, available points
- Tabs:
  - "Disponibles": redeemable rewards catalog
  - "Mis cupones": already-redeemed coupons ready to use
- Featured reward: gradient green card, most relevant offer (e.g. "-15% en tu compra · 100 pts")
- Catalog items: icon, name, description, point cost, expiry date, "Canjear" button (if points sufficient)
- Locked rewards: show points deficit (e.g. "Faltan 147"); drives continued scanning behavior

---

## Main Flow
1. User enters store → Main empty state: current points + daily sponsored products
2. Tap "Escanear producto" → Camera opens
3. Valid barcode scanned → Return to main: product in list, toast, pending points updated
4. Repeat scanning; each scan updates list and pending total
5. Tap "Generar QR de salida" → QR screen shown
6. Cashier scans QR → POS validates → Confirmation screen: points credited
7. Optional: navigate to Rewards to redeem points for coupons
