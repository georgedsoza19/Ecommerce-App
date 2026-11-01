import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../src/users/schemas/user.schema';
import { Category } from '../src/categories/schemas/category.schema';
import { Product } from '../src/products/schemas/product.schema';
import { Coupon, CouponType } from '../src/coupons/schemas/coupon.schema';
import { Banner } from '../src/banners/schemas/banner.schema';
import { StoreSetting } from '../src/settings/schemas/store-setting.schema';
import { Address } from '../src/addresses/schemas/address.schema';
import { Order, OrderStatus } from '../src/orders/schemas/order.schema';

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const productModel = app.get<Model<Product>>(getModelToken(Product.name));
  const couponModel = app.get<Model<Coupon>>(getModelToken(Coupon.name));
  const bannerModel = app.get<Model<Banner>>(getModelToken(Banner.name));
  const settingsModel = app.get<Model<StoreSetting>>(
    getModelToken(StoreSetting.name),
  );
  const addressModel = app.get<Model<Address>>(getModelToken(Address.name));
  const orderModel = app.get<Model<Order>>(getModelToken(Order.name));

  await Promise.all([
    userModel.deleteMany({}),
    categoryModel.deleteMany({}),
    productModel.deleteMany({}),
    couponModel.deleteMany({}),
    bannerModel.deleteMany({}),
    settingsModel.deleteMany({}),
    addressModel.deleteMany({}),
    orderModel.deleteMany({}),
  ]);

  await settingsModel.create({
    storeName: 'Geo',
    supportEmail: 'support@geo.shop',
    currency: 'USD',
    flatShippingCents: 799,
    freeShippingThresholdCents: 7500,
    taxRateBps: 825,
    lowStockThreshold: 5,
  });

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const [admin, customer, customer2] = await userModel.create([
    {
      email: 'admin@geo.shop',
      passwordHash,
      name: 'Geo Admin',
      role: UserRole.ADMIN,
    },
    {
      email: 'customer@example.com',
      passwordHash,
      name: 'Avery Chen',
      phone: '555-0100',
      role: UserRole.CUSTOMER,
    },
    {
      email: 'jordan@example.com',
      passwordHash,
      name: 'Jordan Lee',
      role: UserRole.CUSTOMER,
    },
  ]);

  const categories = await categoryModel.create([
    {
      name: 'Living',
      slug: 'living',
      description: 'Sofas, lighting, and everyday comfort',
      sortOrder: 1,
    },
    {
      name: 'Kitchen',
      slug: 'kitchen',
      description: 'Cookware and tableware',
      sortOrder: 2,
    },
    {
      name: 'Bedroom',
      slug: 'bedroom',
      description: 'Linens and restful essentials',
      sortOrder: 3,
    },
    {
      name: 'Workspace',
      slug: 'workspace',
      description: 'Desks, organizers, and focus tools',
      sortOrder: 4,
    },
  ]);

  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const products = [
    {
      name: 'Oak Side Table',
      slug: 'oak-side-table',
      description:
        'Solid oak side table with a softly rounded edge and oil finish. Sized for a reading lamp and evening tea.',
      priceCents: 18900,
      compareAtCents: 22000,
      sku: 'LV-OST-01',
      stock: 24,
      featured: true,
      categoryId: bySlug.living._id,
      images: [
        {
          url: unsplash('photo-1493663284031-b7e3aefcae8e'),
          alt: 'Oak side table in a living room',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Linen Throw Blanket',
      slug: 'linen-throw-blanket',
      description:
        'Stonewashed linen throw with raw hem. Breathable weight for year-round layering.',
      priceCents: 7800,
      sku: 'LV-LTB-02',
      stock: 40,
      featured: true,
      categoryId: bySlug.living._id,
      images: [
        {
          url: unsplash('photo-1584100936595-c0654b55a2e2'),
          alt: 'Folded linen throw',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Ceramic Floor Lamp',
      slug: 'ceramic-floor-lamp',
      description:
        'Hand-glazed ceramic base with linen shade. Warm ambient light for quiet evenings.',
      priceCents: 24500,
      sku: 'LV-CFL-03',
      stock: 12,
      featured: true,
      categoryId: bySlug.living._id,
      images: [
        {
          url: unsplash('photo-1507473885765-e6ed057f782c'),
          alt: 'Ceramic floor lamp',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Wool Area Rug 5x7',
      slug: 'wool-area-rug-5x7',
      description:
        'Hand-tufted wool rug in muted clay and ivory. Soft underfoot with a low pile.',
      priceCents: 32000,
      sku: 'LV-WAR-04',
      stock: 8,
      categoryId: bySlug.living._id,
      images: [
        {
          url: unsplash('photo-1600166898405-da9535204843'),
          alt: 'Wool area rug',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Cast Iron Skillet 10"',
      slug: 'cast-iron-skillet-10',
      description:
        'Pre-seasoned cast iron skillet that holds heat evenly from stove to oven.',
      priceCents: 6200,
      sku: 'KT-CIS-01',
      stock: 35,
      featured: true,
      categoryId: bySlug.kitchen._id,
      images: [
        {
          url: unsplash('photo-1556910103-1c02745aae4d'),
          alt: 'Cast iron skillet',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Stoneware Dinner Set',
      slug: 'stoneware-dinner-set',
      description:
        'Four-piece stoneware set in matte oat glaze. Microwave and dishwasher safe.',
      priceCents: 9800,
      sku: 'KT-SDS-02',
      stock: 20,
      categoryId: bySlug.kitchen._id,
      images: [
        {
          url: unsplash('photo-1578500494198-246f612d3b3d'),
          alt: 'Stoneware dinner plates',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Beech Cutting Board',
      slug: 'beech-cutting-board',
      description:
        'Thick end-grain beech board with juice groove and carved handle.',
      priceCents: 5400,
      sku: 'KT-BCB-03',
      stock: 28,
      categoryId: bySlug.kitchen._id,
      images: [
        {
          url: unsplash('photo-1590794056226-79ef3a8147e1'),
          alt: 'Wooden cutting board',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Glass Pour-Over Kettle',
      slug: 'glass-pour-over-kettle',
      description:
        'Borosilicate kettle with gooseneck spout for controlled pours.',
      priceCents: 4600,
      sku: 'KT-GPK-04',
      stock: 18,
      categoryId: bySlug.kitchen._id,
      images: [
        {
          url: unsplash('photo-1514228742587-6b155407978c'),
          alt: 'Pour-over kettle',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Percale Sheet Set Queen',
      slug: 'percale-sheet-set-queen',
      description:
        'Crisp 200-thread percale in warm ivory. Breathable and softens with every wash.',
      priceCents: 12800,
      compareAtCents: 14900,
      sku: 'BD-PSS-01',
      stock: 22,
      featured: true,
      categoryId: bySlug.bedroom._id,
      images: [
        {
          url: unsplash('photo-1522771739844-6a9f6d5f14af'),
          alt: 'Made bed with percale sheets',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Down Alternative Duvet',
      slug: 'down-alternative-duvet',
      description:
        'All-season duvet with recycled fill and cotton shell. Machine washable.',
      priceCents: 15900,
      sku: 'BD-DAD-02',
      stock: 15,
      categoryId: bySlug.bedroom._id,
      images: [
        {
          url: unsplash('photo-1631049307264-da0ec9d70304'),
          alt: 'Duvet on bed',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Ceramic Bedside Lamp',
      slug: 'ceramic-bedside-lamp',
      description:
        'Compact ceramic lamp with linen shade—ideal for late-night reading.',
      priceCents: 7200,
      sku: 'BD-CBL-03',
      stock: 30,
      categoryId: bySlug.bedroom._id,
      images: [
        {
          url: unsplash('photo-1513506003901-1e6a229e2d15'),
          alt: 'Bedside lamp',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Linen Pillowcases Pair',
      slug: 'linen-pillowcases-pair',
      description: 'Stonewashed linen pillowcases with envelope closure.',
      priceCents: 4200,
      sku: 'BD-LPP-04',
      stock: 4,
      categoryId: bySlug.bedroom._id,
      images: [
        {
          url: unsplash('photo-1584100936595-c0654b55a2e2'),
          alt: 'Linen pillowcases',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Walnut Desk Organizer',
      slug: 'walnut-desk-organizer',
      description:
        'Solid walnut tray with compartments for pens, cards, and small tools.',
      priceCents: 5800,
      sku: 'WS-WDO-01',
      stock: 26,
      featured: true,
      categoryId: bySlug.workspace._id,
      images: [
        {
          url: unsplash('photo-1593062096033-9a2b9601a6a3'),
          alt: 'Desk organizer',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Task Lamp Brass',
      slug: 'task-lamp-brass',
      description:
        'Adjustable brass task lamp with matte black shade and weighted base.',
      priceCents: 11200,
      sku: 'WS-TLB-02',
      stock: 14,
      categoryId: bySlug.workspace._id,
      images: [
        {
          url: unsplash('photo-1507473885765-e6ed057f782c'),
          alt: 'Brass task lamp',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Cork Desk Mat',
      slug: 'cork-desk-mat',
      description:
        'Natural cork desk mat that cushions your keyboard and softens glare.',
      priceCents: 3600,
      sku: 'WS-CDM-03',
      stock: 45,
      categoryId: bySlug.workspace._id,
      images: [
        {
          url: unsplash('photo-1497215728101-856f4ea42174'),
          alt: 'Desk workspace',
          sortOrder: 0,
        },
      ],
    },
    {
      name: 'Notebook Set of Three',
      slug: 'notebook-set-of-three',
      description:
        'A5 notebooks with lay-flat binding and soft-touch covers in earth tones.',
      priceCents: 2800,
      sku: 'WS-NST-04',
      stock: 60,
      categoryId: bySlug.workspace._id,
      images: [
        {
          url: unsplash('photo-1531346878377-a5be20836c33'),
          alt: 'Notebook stack',
          sortOrder: 0,
        },
      ],
    },
  ];

  const createdProducts = await productModel.create(products);

  await couponModel.create([
    {
      code: 'WELCOME10',
      type: CouponType.PERCENT,
      value: 10,
      minSubtotalCents: 5000,
      maxDiscountCents: 5000,
      usageLimit: 1000,
      usedCount: 0,
      active: true,
    },
    {
      code: 'FREESHIP',
      type: CouponType.FIXED,
      value: 799,
      minSubtotalCents: 2500,
      usageLimit: 500,
      usedCount: 0,
      active: true,
    },
  ]);

  await bannerModel.create([
    {
      title: 'Quiet rooms, lasting pieces',
      subtitle: 'Home goods made for everyday ritual',
      imageUrl: unsplash('photo-1616486338812-3dadae4b4ace'),
      linkUrl: '/products',
      placement: 'home-hero',
      sortOrder: 0,
      active: true,
    },
    {
      title: 'Spring kitchen edit',
      subtitle: 'Tools that earn their place on the counter',
      imageUrl: unsplash('photo-1556911220-bff31c28c8e6'),
      linkUrl: '/products?category=kitchen',
      placement: 'home-promo',
      sortOrder: 1,
      active: true,
    },
  ]);

  const address = await addressModel.create({
    userId: customer._id,
    fullName: 'Avery Chen',
    line1: '128 Harbor Ave',
    line2: 'Apt 4B',
    city: 'Portland',
    region: 'OR',
    postalCode: '97201',
    country: 'US',
    phone: '555-0100',
    isDefault: true,
  });

  const sampleProduct = createdProducts[0];
  await orderModel.create({
    orderNumber: 'GEO-000001',
    userId: customer._id,
    items: [
      {
        productId: sampleProduct._id,
        name: sampleProduct.name,
        sku: sampleProduct.sku,
        unitPriceCents: sampleProduct.priceCents,
        quantity: 1,
        imageUrl: sampleProduct.images[0]?.url ?? '',
      },
    ],
    shippingAddress: {
      fullName: address.fullName,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      region: address.region,
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone,
    },
    subtotalCents: sampleProduct.priceCents,
    discountCents: 0,
    shippingCents: 0,
    taxCents: Math.floor((sampleProduct.priceCents * 825) / 10000),
    totalCents:
      sampleProduct.priceCents +
      Math.floor((sampleProduct.priceCents * 825) / 10000),
    status: OrderStatus.DELIVERED,
    couponCode: null,
    paymentRef: 'sim_seedorder0001',
    paidAt: new Date(),
  });

  console.log('Seed complete');
  console.log('Admin: admin@geo.shop / Password123!');
  console.log('Customer: customer@example.com / Password123!');
  console.log(`Also seeded: ${customer2.email}`);
  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
