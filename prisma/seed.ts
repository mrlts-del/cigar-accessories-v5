import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker'; // Assuming faker is available or can be added

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Create placeholder categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Category 1',
      slug: 'category-1', // Add this line
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
    const productDescription = faker.lorem.paragraphs(2);
    const basePrice = faker.commerce.price({ min: 10, max: 100, dec: 2 });
    const salePrice = i % 2 === 0 ? parseFloat(faker.commerce.price({ min: 5, max: parseFloat(basePrice), dec: 2 })) as number : undefined;
    const tags = faker.lorem.words(3).split(' ');
    const seoTitle = `${productName} | E-commerce Store`;
    const seoDescription = faker.lorem.sentence();

    const product = await prisma.product.create({
      data: {
        name: productName,
        description: productDescription,
        slug: faker.lorem.slug() + `-${i}`,
        price: parseFloat(basePrice), // Add the required price field
        basePrice: parseFloat(basePrice),
        salePrice: salePrice,
        tags: tags,
        seoTitle: seoTitle,
        seoDescription: seoDescription,
        categories: {
          connect: [{ id: category1.id }, { id: category2.id }], // Link to placeholder categories
        },
        media: {
          create: [
            {
              url: faker.image.url(),
              altText: `${productName} Image 1`,
              order: 1,
            },
            {
              url: faker.image.url(),
              altText: `${productName} Image 2`,
              order: 2,
            },
          ],
        },
        // Add placeholder data for other required fields if any
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