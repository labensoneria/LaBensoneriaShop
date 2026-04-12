import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@labensoneria.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin_dev_password';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, name: 'Admin', isAdmin: true },
  });
  console.log(`✓ Admin: ${adminEmail}`);

  // AppSettings por defecto
  const defaultSettings: { key: string; value: string }[] = [
    { key: 'ordersEnabled',         value: 'true' },
    { key: 'newProductDays',        value: '14' },
    { key: 'shipping_peninsular',   value: '4.95' },
    { key: 'shipping_baleares',     value: '7.95' },
    { key: 'shipping_canarias',     value: '12.00' },
    { key: 'shipping_international',value: '20.00' },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSettings.upsert({
      where:  { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✓ AppSettings por defecto (incl. tarifas de envío)');

  // 3 productos de ejemplo
  const products = [
    {
      name: 'Peluche Oso Panda',
      description: 'Adorable oso panda tejido a mano con hilo amigurumi. Perfecto como regalo o decoración. Medidas aproximadas: 20 cm de alto.',
      price: 28.0,
      convertibleToKeychain: false,
    },
    {
      name: 'Llavero Corazón',
      description: 'Pequeño corazón crochet disponible en múltiples colores. Resistente y compacto, ideal para llevar en el bolso o mochila.',
      price: 8.5,
      convertibleToKeychain: true,
    },
    {
      name: 'Peluche Conejo',
      description: 'Tierno conejo artesanal con orejas largas y colores pastel. Hecho con lana suave e hipoalergénica. Puede convertirse en llavero.',
      price: 22.0,
      convertibleToKeychain: true,
    },
  ];

  for (const data of products) {
    const existing = await prisma.product.findFirst({ where: { name: data.name } });
    if (!existing) {
      await prisma.product.create({ data });
      console.log(`✓ Producto: ${data.name}`);
    } else {
      console.log(`- Producto ya existe: ${data.name}`);
    }
  }

  console.log('\nSeed completado.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
