import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const plainPassword = 'password123';

// Realistic business names for partners
const businessNames = [
  'Starbucks Coffee', 'Costa Coffee', 'Pret A Manger', 'Greggs', 'Subway',
  'McDonald\'s', 'KFC', 'Burger King', 'Pizza Hut', 'Domino\'s Pizza',
  'Nando\'s', 'Wagamama', 'Zizzi', 'PizzaExpress', 'Bella Italia',
  'Tesco Express', 'Sainsbury\'s Local', 'Co-op Food', 'Morrisons Daily', 'ASDA Express',
  'Boots Pharmacy', 'Superdrug', 'Lloyds Pharmacy', 'Holland & Barrett', 'GNC',
  'H&M', 'Zara', 'Topshop', 'River Island', 'New Look',
  'Primark', 'M&S', 'John Lewis', 'Debenhams', 'House of Fraser',
  'JD Sports', 'Sports Direct', 'Foot Locker', 'Nike Store', 'Adidas Store',
  'Apple Store', 'Currys PC World', 'Carphone Warehouse', 'EE Store', 'O2 Store',
  'Vodafone Store', 'Three Store', 'BT Store', 'Sky Store', 'Virgin Media Store',
  'Cineworld', 'Odeon', 'Vue Cinema', 'Showcase Cinema', 'Everyman Cinema',
  'PureGym', 'The Gym Group', 'Fitness First', 'Virgin Active', 'Nuffield Health',
  'Holiday Inn', 'Premier Inn', 'Travelodge', 'Ibis', 'Novotel',
  'Hilton', 'Marriott', 'Best Western', 'Comfort Inn', 'Days Inn',
  'Shell', 'BP', 'Esso', 'Texaco', 'Gulf',
  'Costa Coffee Express', 'Starbucks Drive-Thru', 'McDonald\'s Drive-Thru', 'KFC Drive-Thru', 'Burger King Drive-Thru',
  'Subway Express', 'Pizza Hut Express', 'Domino\'s Express', 'Nando\'s Express', 'Wagamama Express',
  'Tesco Metro', 'Sainsbury\'s Central', 'Co-op Central', 'Morrisons Central', 'ASDA Central',
  'Boots Express', 'Superdrug Express', 'Lloyds Express', 'Holland & Barrett Express', 'GNC Express',
  'H&M Outlet', 'Zara Outlet', 'Topshop Outlet', 'River Island Outlet', 'New Look Outlet',
  'Primark Outlet', 'M&S Outlet', 'John Lewis Outlet', 'Debenhams Outlet', 'House of Fraser Outlet',
  'JD Sports Outlet', 'Sports Direct Outlet', 'Foot Locker Outlet', 'Nike Outlet', 'Adidas Outlet',
  'Apple Store Express', 'Currys Express', 'Carphone Express', 'EE Express', 'O2 Express',
  'Vodafone Express', 'Three Express', 'BT Express', 'Sky Express', 'Virgin Express',
  'Cineworld Express', 'Odeon Express', 'Vue Express', 'Showcase Express', 'Everyman Express',
  'PureGym Express', 'The Gym Express', 'Fitness Express', 'Virgin Express', 'Nuffield Express'
];

// Realistic partner names
const partnerNames = [
  'Sarah Johnson', 'Michael Chen', 'Emma Williams', 'David Rodriguez', 'Lisa Thompson',
  'James Brown', 'Maria Garcia', 'Robert Wilson', 'Jennifer Davis', 'Christopher Miller',
  'Amanda Taylor', 'Daniel Anderson', 'Jessica Martinez', 'Matthew Jackson', 'Nicole White',
  'Andrew Harris', 'Stephanie Clark', 'Kevin Lewis', 'Rachel Lee', 'Steven Walker',
  'Michelle Hall', 'Brian Allen', 'Kimberly Young', 'Jason King', 'Ashley Wright',
  'Ryan Lopez', 'Amber Hill', 'Eric Scott', 'Brittany Green', 'Timothy Adams',
  'Megan Baker', 'Jonathan Gonzalez', 'Lauren Roberts', 'Joshua Campbell', 'Heather Mitchell',
  'Brandon Carter', 'Samantha Roberts', 'Nathan Turner', 'Rebecca Phillips', 'Adam Campbell',
  'Stephanie Parker', 'Kevin Evans', 'Nicole Edwards', 'Steven Collins', 'Rachel Stewart',
  'Brian Sanchez', 'Amber Morris', 'Eric Rogers', 'Kimberly Reed', 'Timothy Cook',
  'Megan Morgan', 'Jonathan Bell', 'Lauren Murphy', 'Joshua Bailey', 'Heather Rivera'
];

// Realistic customer names
const customerNames = [
  'John Smith', 'Emily Jones', 'Michael Brown', 'Sarah Davis', 'David Wilson',
  'Lisa Anderson', 'Robert Taylor', 'Jennifer Thomas', 'Christopher Jackson', 'Amanda White',
  'Matthew Harris', 'Ashley Martin', 'Joshua Thompson', 'Jessica Garcia', 'Andrew Martinez',
  'Stephanie Robinson', 'Kevin Clark', 'Nicole Rodriguez', 'Steven Lewis', 'Rachel Lee',
  'Brian Walker', 'Amber Hall', 'Eric Allen', 'Kimberly Young', 'Timothy King',
  'Megan Wright', 'Jonathan Lopez', 'Lauren Hill', 'Joshua Scott', 'Heather Green',
  'Brandon Adams', 'Samantha Baker', 'Nathan Gonzalez', 'Rebecca Nelson', 'Adam Carter',
  'Stephanie Mitchell', 'Kevin Perez', 'Nicole Roberts', 'Steven Turner', 'Rachel Phillips',
  'Brian Campbell', 'Amber Parker', 'Eric Evans', 'Kimberly Edwards', 'Timothy Collins',
  'Megan Stewart', 'Jonathan Sanchez', 'Lauren Morris', 'Joshua Rogers', 'Heather Reed',
  'Brandon Cook', 'Samantha Morgan', 'Nathan Bell', 'Rebecca Murphy', 'Adam Bailey',
  'Stephanie Rivera', 'Kevin Cooper', 'Nicole Richardson', 'Steven Cox', 'Rachel Howard',
  'Brian Ward', 'Amber Torres', 'Eric Peterson', 'Kimberly Gray', 'Timothy Ramirez',
  'Megan James', 'Jonathan Watson', 'Lauren Brooks', 'Joshua Kelly', 'Heather Sanders',
  'Brandon Price', 'Samantha Bennett', 'Nathan Wood', 'Rebecca Barnes', 'Adam Ross',
  'Stephanie Henderson', 'Kevin Coleman', 'Nicole Jenkins', 'Steven Perry', 'Rachel Powell',
  'Brian Long', 'Amber Patterson', 'Eric Hughes', 'Kimberly Flores', 'Timothy Washington',
  'Megan Butler', 'Jonathan Simmons', 'Lauren Foster', 'Joshua Gonzales', 'Heather Bryant',
  'Brandon Alexander', 'Samantha Russell', 'Nathan Griffin', 'Rebecca Diaz', 'Adam Hayes'
];

// Customer surnames for more variety
const customerSurnames = [
  'Smith', 'Jones', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
  'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
  'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips',
  'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed',
  'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard',
  'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks', 'Kelly', 'Sanders',
  'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson', 'Coleman', 'Jenkins', 'Perry', 'Powell',
  'Long', 'Patterson', 'Hughes', 'Flores', 'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant',
  'Alexander', 'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham', 'Sullivan',
  'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds', 'Fisher', 'Ellis', 'Harrison'
];

// Generate random email
function generateEmail(name: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = domains[index % domains.length];
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return `${cleanName}${index}@${domain}`;
}

// Generate random phone number
function generatePhone(): string {
  const prefixes = ['071', '072', '073', '074', '075', '076', '077', '078', '079'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `${prefix}${number.toString().slice(0, 8)}`;
}

// Generate random date between start and end
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random date within a specific month
function randomDateInMonth(year: number, month: number): Date {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return randomDate(startDate, endDate);
}

// Generate transaction amounts between £1 and £249
function generateTransactionAmount(): number {
  return Math.round((Math.random() * 248 + 1) * 100) / 100; // Round to 2 decimal places
}

// Generate points based on amount (1 point per £1 spent)
function calculatePoints(amount: number): number {
  return Math.floor(amount);
}

// Clear existing data
async function clearExistingData() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete in correct order due to foreign key constraints
  await prisma.voucher.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.tenantPointsConfig.deleteMany();
  await prisma.subscriptionPayment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.admin.deleteMany();
  
  // Handle User-Tenant relationship carefully
  // First, set tenantId to null for all users
  await prisma.user.updateMany({
    data: { tenantId: null }
  });
  
  // Then delete tenants
  await prisma.tenant.deleteMany();
  
  // Finally delete users
  await prisma.user.deleteMany();
  
  console.log('✅ Existing data cleared');
}

// Create subscription tiers
async function createSubscriptionTiers() {
  console.log('📊 Creating subscription tiers...');
  
  const tiers = [
    { name: 'BASIC', displayName: 'Basic Plan', price: 29.99 },
    { name: 'PROFESSIONAL', displayName: 'Professional Plan', price: 59.99 },
    { name: 'ENTERPRISE', displayName: 'Enterprise Plan', price: 99.99 }
  ];

  for (const tier of tiers) {
    await prisma.subscriptionTier.upsert({
      where: { name: tier.name },
      update: tier,
      create: tier,
    });
  }
  
  console.log('✅ Subscription tiers created');
}

// Create partners (100 per month from 2022 to 2025)
async function createPartners() {
  console.log('👥 Creating partners...');
  
  const startYear = 2022;
  const endYear = 2025;
  const partnersPerMonth = 100;
  const hashedPassword = await hash(plainPassword, 12);
  
  let partnerCount = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    const endMonth = year === endYear ? 11 : 11; // December is month 11 (0-indexed)
    
    for (let month = 0; month <= endMonth; month++) {
      console.log(`Creating ${partnersPerMonth} partners for ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}...`);
      
      const partners = [];
      for (let i = 0; i < partnersPerMonth; i++) {
        const name = partnerNames[partnerCount % partnerNames.length];
        const businessName = businessNames[partnerCount % businessNames.length];
        const email = generateEmail(name, partnerCount);
        const signupDate = randomDateInMonth(year, month);
        
        partners.push({
          name: name,
          email: email,
          password: hashedPassword,
          role: 'PARTNER',
          approvalStatus: 'ACTIVE',
          createdAt: signupDate,
          updatedAt: signupDate,
        });
        
        partnerCount++;
      }
      
      // Create users in batches
      const createdUsers = await prisma.user.createMany({
        data: partners,
      });
      
      // Create tenants for each partner
      const createdPartnerUsers = await prisma.user.findMany({
        where: {
          email: {
            in: partners.map(p => p.email)
          }
        }
      });
      
      const tenants = [];
      for (const user of createdPartnerUsers) {
        const tenantSignupDate = randomDateInMonth(year, month);
        tenants.push({
          name: businessNames[createdPartnerUsers.indexOf(user) % businessNames.length],
          partnerUserId: user.id,
          subscriptionTier: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'][Math.floor(Math.random() * 3)],
          subscriptionStatus: 'ACTIVE',
          nextBillingDate: new Date(year, month + 1, 1),
          createdAt: tenantSignupDate,
          updatedAt: tenantSignupDate,
        });
      }
      
      await prisma.tenant.createMany({
        data: tenants,
      });
    }
  }
  
  console.log(`✅ Created ${partnerCount} partners across ${(endYear - startYear + 1) * 12} months`);
}

// Create customers (1000 per month from 2022 to 2025)
async function createCustomers() {
  console.log('👤 Creating customers...');
  
  const startYear = 2022;
  const endYear = 2025;
  const customersPerMonth = 1000;
  const hashedPassword = await hash(plainPassword, 12);
  
  // Get all tenants to assign customers to
  const tenants = await prisma.tenant.findMany();
  
  let customerCount = 0;
  
  for (let year = startYear; year <= endYear; year++) {
    const endMonth = year === endYear ? 11 : 11; // December is month 11 (0-indexed)
    
    for (let month = 0; month <= endMonth; month++) {
      console.log(`Creating ${customersPerMonth} customers for ${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}...`);
      
      const customers = [];
      for (let i = 0; i < customersPerMonth; i++) {
        const firstName = customerNames[customerCount % customerNames.length];
        const lastName = customerSurnames[Math.floor(Math.random() * customerSurnames.length)];
        const fullName = `${firstName} ${lastName}`;
        const email = generateEmail(fullName, customerCount);
        const mobile = generatePhone();
        const signupDate = randomDateInMonth(year, month);
        const tenant = tenants[Math.floor(Math.random() * tenants.length)];
        
        customers.push({
          name: fullName,
          email: email,
          mobile: mobile,
          tenantId: tenant.id,
          createdAt: signupDate,
          updatedAt: signupDate,
        });
        
        customerCount++;
      }
      
      await prisma.customer.createMany({
        data: customers,
      });
    }
  }
  
  console.log(`✅ Created ${customerCount} customers across ${(endYear - startYear + 1) * 12} months`);
}

// Create transactions (8 per customer per month)
async function createTransactions() {
  console.log('💰 Creating transactions...');
  
  const customers = await prisma.customer.findMany({
    include: {
      tenant: true
    }
  });
  
  const transactionsPerCustomerPerMonth = 8;
  let transactionCount = 0;
  
  for (const customer of customers) {
    const signupDate = customer.createdAt;
    const currentDate = new Date();
    
    // Calculate months between signup and now
    const monthsDiff = (currentDate.getFullYear() - signupDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - signupDate.getMonth());
    
    const monthsToProcess = Math.min(monthsDiff, 36); // Limit to 3 years of transactions
    
    for (let month = 0; month < monthsToProcess; month++) {
      const transactionDate = new Date(signupDate.getFullYear(), signupDate.getMonth() + month, 1);
      
      // Generate 8 transactions for this month
      for (let i = 0; i < transactionsPerCustomerPerMonth; i++) {
        const amount = generateTransactionAmount();
        const points = calculatePoints(amount);
        const transactionDateTime = randomDateInMonth(
          transactionDate.getFullYear(), 
          transactionDate.getMonth()
        );
        
        await prisma.transaction.create({
          data: {
            amount: amount,
            points: points,
            customerId: customer.id,
            tenantId: customer.tenantId,
            userId: customer.tenant.partnerUserId,
            status: 'completed',
            type: 'purchase',
            createdAt: transactionDateTime,
            updatedAt: transactionDateTime,
          }
        });
        
        transactionCount++;
      }
    }
    
    if (transactionCount % 10000 === 0) {
      console.log(`Created ${transactionCount} transactions so far...`);
    }
  }
  
  console.log(`✅ Created ${transactionCount} transactions`);
}

// Create system config
async function createSystemConfig() {
  console.log('⚙️  Creating system configuration...');
  
  await prisma.systemConfig.upsert({
    where: { id: 'system-config-1' },
    update: {},
    create: {
      id: 'system-config-1',
      pointFaceValue: 0.01,
      systemFixedCharge: 0.001,
      systemVariableCharge: 0.06,
    },
  });
  
  console.log('✅ System configuration created');
}

// Main seeding function
async function main() {
  console.log('🌱 Starting comprehensive database reseeding...');
  
  try {
    await clearExistingData();
    await createSubscriptionTiers();
    await createSystemConfig();
    await createPartners();
    await createCustomers();
    await createTransactions();
    
    console.log('🎉 Database reseeding completed successfully!');
    
    // Print summary
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();
    const customerCount = await prisma.customer.count();
    const transactionCount = await prisma.transaction.count();
    
    console.log('\n📊 Database Summary:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Tenants: ${tenantCount}`);
    console.log(`👤 Customers: ${customerCount}`);
    console.log(`💰 Transactions: ${transactionCount}`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
