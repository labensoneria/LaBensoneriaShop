import { AppError } from '../utils/AppError';

const BASE = process.env.PACKLINK_API_URL ?? 'https://api.packlink.com';
const VAT  = Number.parseFloat(process.env.SHIPPING_VAT_MULTIPLIER ?? '1.21');
const MOCK = process.env.MOCK_PACKLINK === 'true';
if (MOCK && process.env.NODE_ENV === 'production') {
  throw new Error('MOCK_PACKLINK must not be enabled in production');
}
if (MOCK) console.log('[packlink] MOCK MODE — no real API calls will be made');

const SHIPPER = {
  name:    process.env.SHIPPER_NAME    ?? 'La Bensonería',
  street:  process.env.SHIPPER_STREET  ?? '',
  city:    process.env.SHIPPER_CITY    ?? '',
  zip:     process.env.SHIPPER_ZIP     ?? '',
  country: process.env.SHIPPER_COUNTRY ?? 'ES',
  phone:   process.env.SHIPPER_PHONE   ?? '',
  email:   process.env.SHIPPER_EMAIL   ?? '',
};

const BOX = {
  height: Number.parseFloat(process.env.SHIPPER_BOX_H_CM ?? '15'),
  width:  Number.parseFloat(process.env.SHIPPER_BOX_W_CM ?? '20'),
  length: Number.parseFloat(process.env.SHIPPER_BOX_L_CM ?? '25'),
};

export type Package = {
  weight: number; // kg
  height: number; // cm
  width:  number; // cm
  length: number; // cm
};

export type QuotedService = {
  serviceId:   number;
  carrierId:   string;
  carrierName: string;
  serviceName: string;
  priceBase:   number;
  priceTotal:  number; // VAT-inclusive
  transitDays?: number;
  dropoff:     boolean;
};

export type PickupPoint = {
  id:      string;
  name:    string;
  address: string;
  city:    string;
  zip:     string;
};

export class PacklinkError extends AppError {
  constructor(message: string, status = 502, public providerCode?: string) {
    super(message, status);
  }
}

function headers(): Record<string, string> {
  const key = process.env.PACKLINK_API_KEY;
  if (!key) throw new PacklinkError('PACKLINK_API_KEY not configured', 500);
  return {
    'Authorization': key,
    'Content-Type':  'application/json',
  };
}

const BASE_ORIGIN = new URL(BASE).origin;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  // Defense-in-depth: resolve `path` against the configured base and refuse
  // anything that escapes the Packlink origin (protocol-relative URLs, absolute
  // URLs, ../ traversal). All callers pass internal strings, but this keeps
  // any future caller from accidentally introducing SSRF.
  const url = new URL(path, BASE_ORIGIN + '/');
  if (url.origin !== BASE_ORIGIN) {
    throw new PacklinkError(`Refusing to call non-Packlink URL: ${url.origin}`, 500);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...headers(), ...((init?.headers as Record<string, string>) ?? {}) } });
  } catch (err) {
    throw new PacklinkError(`Packlink network error: ${(err as Error).message}`, 502);
  }
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!res.ok) {
    console.error(`[packlink] HTTP ${res.status} on ${path} — body:`, text);
    const message = (body as any)?.messages?.[0]?.message
      ?? (body as any)?.message
      ?? `Packlink ${res.status}`;
    throw new PacklinkError(message, 502, String(res.status));
  }
  return body as T;
}

export function buildPackage(items: Array<{ weightGrams: number; quantity: number }>): Package {
  const grams = items.reduce((acc, i) => acc + i.weightGrams * i.quantity, 0);
  const kg = Math.max(0.1, Math.round((grams / 1000) * 100) / 100);
  return { weight: kg, height: BOX.height, width: BOX.width, length: BOX.length };
}

export async function quoteShipping(params: {
  toCountry: string;
  toZip:     string;
  packages:  Package[];
}): Promise<{ home: QuotedService[]; pickup: QuotedService[] }> {
  if (MOCK) {
    return {
      home: [{
        serviceId: 99001, carrierId: 'MOCK', carrierName: 'MockCarrier',
        serviceName: 'Mock Home Delivery', priceBase: 4.5, priceTotal: 5.45,
        transitDays: 2, dropoff: false,
      }],
      pickup: [{
        serviceId: 99002, carrierId: 'MOCK', carrierName: 'MockCarrier',
        serviceName: 'Mock Pickup Point', priceBase: 3.5, priceTotal: 4.24,
        transitDays: 3, dropoff: true,
      }],
    };
  }
  const q = new URLSearchParams();
  q.set('from[country]', SHIPPER.country);
  q.set('from[zip]',     SHIPPER.zip);
  q.set('to[country]',   params.toCountry);
  q.set('to[zip]',       params.toZip);
  params.packages.forEach((p, i) => {
    q.set(`packages[${i}][weight]`, String(p.weight));
    q.set(`packages[${i}][height]`, String(p.height));
    q.set(`packages[${i}][width]`,  String(p.width));
    q.set(`packages[${i}][length]`, String(p.length));
  });

  const raw = await call<any[]>(`/v1/services?${q.toString()}`, { method: 'GET' });

  const home: QuotedService[]   = [];
  const pickup: QuotedService[] = [];
  for (const s of raw ?? []) {
    const dropoff = !!(
      s.service_info?.dropoff_destination ||
      s.dropoff_destination ||
      s.dropoff ||
      s.service_info?.type === 'DROPOFF' ||
      s.delivery_type === 'dropoff' ||
      s.to_type === 'dropoff'
    );
    const priceBase = Number.parseFloat(s.price?.total_price ?? s.price?.base_price ?? '0');
    if (!Number.isFinite(priceBase) || priceBase <= 0) continue;
    if (dropoff) console.log('[packlink] pickup service FULL:', JSON.stringify(s));
    const quoted: QuotedService = {
      serviceId:   Number(s.id ?? s.service_id),
      carrierId:   String(s.carrier_name ?? s.carrier ?? ''),
      carrierName: String(s.carrier_name ?? s.carrier ?? ''),
      serviceName: String(s.name ?? s.service_name ?? ''),
      priceBase,
      priceTotal:  Math.round(priceBase * VAT * 100) / 100,
      transitDays: s.transit_time?.max ?? s.transit_time ?? undefined,
      dropoff,
    };
    (dropoff ? pickup : home).push(quoted);
  }
  home.sort((a, b)   => a.priceTotal - b.priceTotal);
  pickup.sort((a, b) => a.priceTotal - b.priceTotal);
  return { home, pickup };
}

export async function getPickupPoints(carrierId: string, country: string, zip: string): Promise<PickupPoint[]> {
  if (MOCK) {
    return [
      { id: 'MOCK_POINT_1', name: 'Mock Locker (centro)', address: 'Calle Falsa 123', city: 'Madrid', zip },
      { id: 'MOCK_POINT_2', name: 'Mock Locker (norte)',  address: 'Avenida Falsa 456', city: 'Madrid', zip },
    ];
  }
  console.log(`[packlink] getPickupPoints carrierId="${carrierId}" country="${country}" zip="${zip}"`);
  const raw = await call<any[]>(`/v1/dropoffs/${encodeURIComponent(carrierId)}/${encodeURIComponent(country)}/${encodeURIComponent(zip)}`, { method: 'GET' });
  return (raw ?? []).map((p: any) => ({
    id:      String(p.id ?? p.code),
    name:    String(p.name ?? ''),
    address: String(p.address ?? p.street ?? ''),
    city:    String(p.city ?? ''),
    zip:     String(p.zip ?? p.postal_code ?? ''),
  }));
}

type OrderLike = {
  id: string;
  guestName?:  string | null;
  guestEmail?: string | null;
  shippingCost: { toString(): string };
  packlinkServiceId?: number | null;
  pickupPointId?: string | null;
  address: {
    name: string; street: string; street2: string | null;
    city: string; postalCode: string; country: string;
  } | null;
  items: Array<{
    quantity: number;
    product: { name: string; weightGrams?: number };
  }>;
};

export async function createShipment(
  order: OrderLike,
  opts: { serviceId: number; pickupPointId?: string },
): Promise<{ reference: string; trackingNumber?: string; trackingUrl?: string; labelUrl?: string }> {
  if (MOCK) {
    return {
      reference:      `MOCK_REF_${order.id}`,
      trackingNumber: `MOCKTRK${Date.now()}`,
      trackingUrl:    'https://example.com/mock-tracking',
      labelUrl:       'https://example.com/mock-label.pdf',
    };
  }
  if (!order.address) throw new PacklinkError('Order missing address', 400);

  const pkg = buildPackage(
    order.items.map((i) => ({ weightGrams: i.product.weightGrams ?? 250, quantity: i.quantity })),
  );

  const content = order.items.map((i) => `${i.quantity}× ${i.product.name}`).join(', ').slice(0, 120) || 'Crochet';

  const payload: any = {
    service_id: opts.serviceId,
    content,
    price: { amount: Number.parseFloat(order.shippingCost.toString()), currency: 'EUR' },
    from: {
      name:    SHIPPER.name,
      street1: SHIPPER.street,
      city:    SHIPPER.city,
      zip_code: SHIPPER.zip,
      country: SHIPPER.country,
      phone:   SHIPPER.phone,
      email:   SHIPPER.email,
    },
    to: {
      name:    order.address.name,
      street1: order.address.street,
      street2: order.address.street2 ?? '',
      city:    order.address.city,
      zip_code: order.address.postalCode,
      country: order.address.country,
      phone:   '',
      email:   order.guestEmail ?? '',
    },
    packages: [{
      weight: pkg.weight,
      height: pkg.height,
      width:  pkg.width,
      length: pkg.length,
    }],
  };

  if (opts.pickupPointId) {
    payload.dropoff_point_id = opts.pickupPointId;
  }

  const raw = await call<any>('/v1/shipments', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  return {
    reference:      String(raw.reference ?? raw.id),
    trackingNumber: raw.tracking_codes?.[0] ?? raw.tracking_number ?? undefined,
    trackingUrl:    raw.trackings?.[0] ?? raw.tracking_url ?? undefined,
    labelUrl:       raw.labels?.[0] ?? raw.label_url ?? undefined,
  };
}

export async function payShipment(reference: string): Promise<void> {
  if (MOCK) return;
  await call<unknown>(`/v1/shipments/${encodeURIComponent(reference)}/payment`, { method: 'POST' });
}

export async function getShipment(reference: string): Promise<{
  trackingNumber?: string; trackingUrl?: string; labelUrl?: string;
}> {
  if (MOCK) {
    return {
      trackingNumber: `MOCKTRK_${reference}`,
      trackingUrl:    'https://example.com/mock-tracking',
      labelUrl:       'https://example.com/mock-label.pdf',
    };
  }
  const raw = await call<any>(`/v1/shipments/${encodeURIComponent(reference)}`, { method: 'GET' });
  return {
    trackingNumber: raw.tracking_codes?.[0] ?? raw.tracking_number ?? undefined,
    trackingUrl:    raw.trackings?.[0] ?? raw.tracking_url ?? undefined,
    labelUrl:       raw.labels?.[0] ?? raw.label_url ?? undefined,
  };
}
