import prisma from '../utils/prisma';

const DEFAULTS: Record<string, string> = {
  ordersEnabled:          'true',
  newProductDays:         '14',
  globalDiscountPercent:  '0',
  shipping_peninsular:    '5.92',
  shipping_baleares:      '7.55',
  shipping_canarias:      '11.37',
  shipping_international: '20.00',
};

const ALLOWED_KEYS = new Set([
  'ordersEnabled',
  'newProductDays',
  'globalDiscountPercent',
  'shipping_peninsular',
  'shipping_baleares',
  'shipping_canarias',
  'shipping_international',
]);

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSettings.findMany({
    where: { key: { in: [...ALLOWED_KEYS] } },
  });
  const map: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function updateSettings(data: Record<string, string>): Promise<Record<string, string>> {
  for (const [key, value] of Object.entries(data)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    await prisma.appSettings.upsert({
      where:  { key },
      update: { value },
      create: { key, value },
    });
  }
  return getSettings();
}
