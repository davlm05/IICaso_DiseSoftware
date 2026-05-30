# Geo Shopping Assistant

**Members:** Marlon Badilla - Daniel Campos - Issac Corrales - Guillermo Coto - Kevin Espinoza - David López

## Context
The sector is grocery retail in Costa Rica, an industry composed of 5 major chains (Walmart/Mas x Menos/Pali, Auto Mercado, MegaSuper,
Gessa, and PriceSmart) operating over 350 formal supermarkets, complemented by approximately 13,000 pulperías and mini-markets. The
supermarket market value in Costa Rica reached ~$300 million USD by 2023, serving a population of 5 million plus ~2 million annual tourists.
Despite this scale, supermarkets and consumer brands lack real-time, granular data on customer purchasing behavior, product preferences,
and in-store engagement — making targeted marketing and demand prediction nearly impossible. Loyalty programs exist but generate little
actionable intelligence, and brands have no direct channel to understand how their products perform at the shelf level across different regions
and consumer segments.

## Idea
SmartCart is a mobile loyalty and retail intelligence platform. Consumers use the app to scan sponsored products while shopping; each scan
of a participating product earns points that can be redeemed for discount coupons and rewards. This creates the user engagement loop:
Discover → Scan → Validate → Earn → Redeem. Purchase validation happens at checkout via a QR code that the cashier scans at the POS,
ensuring only products actually purchased generate points. On the business side, the platform aggregates anonymized purchase and
behavioral data from every transaction and sells these insights — as a SaaS analytics product — to supermarket chains and consumer brands
seeking to understand regional demand patterns, product performance, and consumer segments.

## Frontend (Phase 2)

The frontend MVP lives in [`frontend/`](frontend/) — a React + Vite + TypeScript web app
(mobile-first) that implements the full loyalty flow against mock services. See
[`frontend/README.md`](frontend/README.md) for the Phase 2 design documentation: stack
and justification, layered architecture, design tokens, the GoF design patterns mapped to
real code in `frontend/src/`, security, performance, testing strategy, and CI/CD.

Run it with: `cd frontend && npm install && npm run dev`.
