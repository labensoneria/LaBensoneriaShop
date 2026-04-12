import request from 'supertest';
import app from '../src/app';

// Mock services
jest.mock('../src/services/products.service', () => ({
  listProducts: jest.fn(),
  getProduct:   jest.fn(),
}));

import * as productsService from '../src/services/products.service';

const mockProduct = {
  id: 'prod-1',
  name: 'Peluche Test',
  description: 'Descripción de prueba',
  price: '22.00',
  convertibleToKeychain: false,
  soldCount: 0,
  active: true,
  publishedAt: new Date().toISOString(),
  images: [],
  reviews: [],
};

describe('GET /api/products', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with products list', async () => {
    (productsService.listProducts as jest.Mock).mockResolvedValue({
      products: [mockProduct],
      total: 1,
      page: 1,
      limit: 12,
      pages: 1,
    });

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('passes sort and page query params to service', async () => {
    (productsService.listProducts as jest.Mock).mockResolvedValue({
      products: [],
      total: 0,
      page: 2,
      limit: 12,
      pages: 0,
    });

    await request(app).get('/api/products?sort=popular&page=2');

    expect(productsService.listProducts).toHaveBeenCalledWith('popular', 2, undefined);
  });

  it('returns 400 for invalid sort value', async () => {
    const res = await request(app).get('/api/products?sort=invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/products/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with product', async () => {
    (productsService.getProduct as jest.Mock).mockResolvedValue(mockProduct);

    const res = await request(app).get('/api/products/prod-1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('prod-1');
  });

  it('returns 404 when product not found', async () => {
    (productsService.getProduct as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get('/api/products/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
