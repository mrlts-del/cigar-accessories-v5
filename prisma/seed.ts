import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('Skipping admin user creation: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not set.');
  } else {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          isAdmin: true,
        },
      });
      console.log(`Created admin user with id: ${adminUser.id}`);
    }
  }

  // Keep existing seeding logic for categories and products
  // Create placeholder categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Category 1',
      slug: 'category-1',
    },
  });

  const category2 = await prisma.category.create({
    data: {
      name: 'Category 2',
      slug: 'category-2',
    },
  });

  // Create 6 placeholder products
  for (let i = 1; i <= 6; i++) {
    const productName = `Test Product ${i}`;
    const productDescription = 'Placeholder description'; // Simplified for brevity
    const basePrice = 10 + i; // Simplified for brevity
    const salePrice = i % 2 === 0 ? (basePrice * 0.8) : undefined; // Simplified for brevity
    const tags = [`tag${i}`, 'test']; // Simplified for brevity
    const seoTitle = `${productName} | E-commerce Store`;
    const seoDescription = `SEO description for ${productName}`; // Simplified for brevity

    const product = await prisma.product.create({
      data: {
        name: productName,
        description: productDescription,
        slug: `test-product-${i}`, // Simplified for brevity
        price: basePrice,
        basePrice: basePrice,
        salePrice: salePrice,
        tags: tags,
        seoTitle: seoTitle,
        seoDescription: seoDescription,
        categories: {
          connect: [{ id: category1.id }, { id: category2.id }],
        },
        media: {
          create: [
            {
              url: `https://example.com/image${i}-1.jpg`, // Simplified for brevity
              altText: `${productName} Image 1`,
              order: 1,
            },
            {
              url: `https://example.com/image${i}-2.jpg`, // Simplified for brevity
              altText: `${productName} Image 2`,
              order: 2,
            },
          ],
        },
      },
    });
    console.log(`Created product with id: ${product.id}`);
  }


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });