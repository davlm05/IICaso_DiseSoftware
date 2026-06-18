import 'dotenv/config';
import { PointsReason, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

/**
 * Demo seed (README §2.9). Idempotent: re-running upserts the same fixtures.
 * Product barcodes match the frontend mock catalog so the two line up.
 */
const prisma = new PrismaClient();

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function main(): Promise<void> {
  // ── Store ──────────────────────────────────────────────────────────────────
  const STORE_ID = '11111111-1111-4111-8111-111111111111';
  const store = await prisma.store.upsert({
    where: { id: STORE_ID },
    update: {},
    create: {
      id: STORE_ID,
      name: 'Super Buen Precio — Curridabat',
    },
  });

  // ── Products (barcodes mirror frontend/src/features/catalog/mockCatalog.ts) ──
  const products = [
    {
      barcode: '7441001823000',
      name: 'Cafe Britt 500g',
      brand: 'Cafe Britt',
      sponsored: true,
      pointsConfig: { type: 'FIXED_PER_UNIT', value: 15 },
    },
    {
      barcode: '7441002934111',
      name: 'Aceite Numar 1L',
      brand: 'Numar',
      sponsored: true,
      pointsConfig: { type: 'FIXED_PER_UNIT', value: 10 },
    },
    {
      barcode: '7441003045222',
      name: 'Galletas Pozuelo',
      brand: 'Pozuelo',
      sponsored: true,
      pointsConfig: { type: 'FIXED_PER_UNIT', value: 8 },
    },
    {
      // Used by the Maestro E2E flow (.maestro/scan-to-redeem.yaml).
      barcode: '7441234567890',
      name: 'Leche Dos Pinos 1L',
      brand: 'Dos Pinos',
      sponsored: false,
      pointsConfig: { type: 'FIXED_PER_UNIT', value: 12 },
    },
    {
      barcode: '7441004056333',
      name: 'Arroz Tio Pelon 1kg',
      brand: 'Tio Pelon',
      sponsored: false,
      // Buy more, earn more per unit.
      pointsConfig: {
        type: 'VOLUME_TIER',
        tiers: [
          { minQty: 1, maxQty: 2, pointsPerUnit: 5 },
          { minQty: 3, maxQty: 99, pointsPerUnit: 8 },
        ],
      },
    },
    {
      barcode: '7441005067444',
      name: 'Pinto Express',
      brand: 'Casa',
      sponsored: false,
      pointsConfig: { type: 'WEEKEND_BONUS', basePoints: 6, weekendMultiplier: 2 },
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {
        name: p.name,
        brand: p.brand,
        sponsored: p.sponsored,
        pointsConfig: p.pointsConfig,
      },
      create: p,
    });
  }

  // ── Rewards (mirror frontend mock costs) ─────────────────────────────────────
  const rewards = [
    { name: 'Descuento ₡1.000', description: 'Cupón de ₡1.000 en tu próxima compra', cost: 50 },
    { name: 'Café gratis', description: 'Un café Britt de cortesía', cost: 75 },
    { name: 'Bolsa reutilizable', description: 'Bolsa ecológica SmartCart', cost: 100 },
    { name: 'Descuento ₡5.000', description: 'Cupón de ₡5.000 en abarrotes', cost: 300 },
  ];
  for (const r of rewards) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (existing) {
      await prisma.reward.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.reward.create({ data: r });
    }
  }

  // ── API keys (POS + B2B) ─────────────────────────────────────────────────────
  const posKey = process.env.POS_API_KEY ?? 'pos-demo-key-0001';
  const b2bKey = process.env.B2B_API_KEY ?? 'b2b-demo-key-0001';
  await prisma.apiKey.upsert({
    where: { hashedKey: sha256(posKey) },
    update: {},
    create: { hashedKey: sha256(posKey), type: 'POS', label: 'Demo POS', storeId: store.id },
  });
  await prisma.apiKey.upsert({
    where: { hashedKey: sha256(b2bKey) },
    update: {},
    create: { hashedKey: sha256(b2bKey), type: 'B2B', label: 'Demo B2B partner' },
  });

  // ── Demo shopper (credentials match the Maestro flow) ────────────────────────
  const passwordHash = await bcrypt.hash('test-password', 10);
  const shopper = await prisma.user.upsert({
    where: { email: 'shopper@example.com' },
    update: {},
    create: {
      email: 'shopper@example.com',
      fullName: 'José Castro',
      phone: '+506 8888-0000',
      role: Role.USER,
      passwordHash,
    },
  });

  // Give the shopper a starting balance so rewards are redeemable in the demo.
  const ledgerCount = await prisma.pointsTransaction.count({
    where: { userId: shopper.id },
  });
  if (ledgerCount === 0) {
    await prisma.pointsTransaction.create({
      data: { userId: shopper.id, delta: 120, reason: PointsReason.ADJUSTMENT },
    });
  }

  console.log('Seed complete:');
  console.log(`  store        : ${store.id} (${store.name})`);
  console.log(`  products     : ${products.length}`);
  console.log(`  rewards      : ${rewards.length}`);
  console.log(`  demo shopper : shopper@example.com / test-password (balance 120)`);
  console.log(`  POS api key  : ${posKey}`);
  console.log(`  B2B api key  : ${b2bKey}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
