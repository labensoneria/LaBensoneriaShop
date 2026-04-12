import { listProducts, getProduct } from '../src/services/products.service';

// Mock Prisma
jest.mock('../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    product: {
      findMany: jest.fn(),
      count:    jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import prisma from '../src/utils/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockProduct = {
  id: 'prod-1',
  name: 'Peluche Test',
  description: 'Desc',
  price: '22.00',
  convertibleToKeychain: false,
  soldCount: 0,
  active: true,
  publishedAt: new Date(),
  images: [],
};

describe('listProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated products with defaults', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);

    const result = await listProducts();

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('calculates pages correctly', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(25);

    const result = await listProducts('newest', 1, 12);

    expect(result.pages).toBe(3);
  });

  it('applies skip based on page', async () => {
    (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);

    await listProducts('newest', 3, 10);

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});

describe('getProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns product when found', async () => {
    (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue({
      ...mockProduct,
      reviews: [],
    });

    const result = await getProduct('prod-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('prod-1');
  });

  it('returns null when not found', async () => {
    (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getProduct('no-existe');

    expect(result).toBeNull();
  });

  it('queries only active products', async () => {
    (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

    await getProduct('prod-1');

    expect(mockPrisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-1', active: true },
      })
    );
  });
});
