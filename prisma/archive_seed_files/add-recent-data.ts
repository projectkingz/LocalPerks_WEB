import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const plainPassword = 'password123';

// Additional business names for new partners
const additionalBusinessNames = [
  'The Coffee Bean', 'Blue Bottle Coffee', 'Dunkin\' Donuts', 'Tim Hortons', 'Caribou Coffee',
  'Peet\'s Coffee', 'Lavazza', 'Illy Coffee', 'Nespresso', 'Caffè Nero',
  'Black Sheep Coffee', 'Monmouth Coffee', 'Workshop Coffee', 'Ozone Coffee', 'Allpress Espresso',
  'Grind Coffee', 'Notes Coffee', 'Department of Coffee', 'Monmouth Coffee', 'Prufrock Coffee',
  'The Gentlemen Baristas', 'WatchHouse', 'Origin Coffee', 'Square Mile Coffee', 'Has Bean',
  'Rave Coffee', 'Union Hand-Roasted', 'Climpson & Sons', 'Caravan Coffee', 'The Roasting Party'
];

// Additional partner names
const additionalPartnerNames = [
  'Alexander Thompson', 'Sophie Mitchell', 'Oliver Richardson', 'Charlotte Wilson', 'Harry Davis',
  'Amelia Brown', 'George Taylor', 'Isabella Anderson', 'Jack Thomas', 'Mia Jackson',
  'Noah White', 'Ava Harris', 'Liam Martin', 'Sophia Thompson', 'William Garcia',
  'Emma Martinez', 'James Robinson', 'Olivia Clark', 'Benjamin Rodriguez', 'Isabella Lewis',
  'Lucas Lee', 'Mia Walker', 'Henry Hall', 'Charlotte Allen', 'Alexander Young',
  'Amelia King', 'Mason Wright', 'Harper Lopez', 'Ethan Hill', 'Evelyn Scott'
];

// Additional customer names
const additionalCustomerNames = [
  'Liam Johnson', 'Emma Williams', 'Noah Brown', 'Olivia Jones', 'William Garcia',
  'Ava Miller', 'James Davis', 'Isabella Rodriguez', 'Oliver Martinez', 'Sophia Hernandez',
  'Benjamin Lopez', 'Charlotte Gonzalez', 'Lucas Wilson', 'Amelia Anderson', 'Henry Thomas',
  'Mia Taylor', 'Alexander Moore', 'Harper Jackson', 'Mason Martin', 'Evelyn Lee',
  'Ethan Perez', 'Abigail Thompson', 'Sebastian White', 'Elizabeth Harris', 'Jack Sanchez',
  'Sofia Clark', 'Owen Ramirez', 'Avery Lewis', 'Carter Robinson', 'Ella Walker'
];

// Additional customer surnames
const additionalCustomerSurnames = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez',
  'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker',
  'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans'
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

// Generate random date within a specific month
function randomDateInMonth(year: number, month: number): Date {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

// Generate transaction amount with average of £127
function generateTransactionAmount(): number {
  // Using normal distribution around £127 with standard deviation of £30
  // This ensures most transactions are between £97-£157 with average £127
  const mean = 127;
  const stdDev = 30;
  
  // Box-Muller transformation for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  const amount = mean + stdDev * z0;
  
  // Ensure amount is positive and reasonable (between £10-£300)
  return Math.max(10, Math.min(300, Math.round(amount * 100) / 100));
}

// Calculate points based on amount (1 point per £1 spent)
function calculatePoints(amount: number): number {
  return Math.floor(amount);
}

// Add recent partners (1 per month for last 3 months)
async function addRecentPartners() {
  console.log('👥 Adding recent partners (1 per month for last 3 months)...');
  
  const hashedPassword = await hash(plainPassword, 12);
  const currentDate = new Date();
  const months = [];
  
  // Get last 3 months
  for (let i = 2; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date);
  }
  
  let partnerCount = 0;
  
  for (const month of months) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    console.log(`Creating 1 partner for ${month.toLocaleString('default', { month: 'long', year: 'numeric' })}...`);
    
    const name = additionalPartnerNames[partnerCount % additionalPartnerNames.length];
    const businessName = additionalBusinessNames[partnerCount % additionalBusinessNames.length];
    const email = generateEmail(name, partnerCount + 10000); // Use high number to avoid conflicts
    const signupDate = randomDateInMonth(year, monthIndex);
    
    // Create partner user
    const partnerUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: 'PARTNER',
        approvalStatus: 'ACTIVE',
        createdAt: signupDate,
        updatedAt: signupDate,
      },
    });
    
    // Create tenant for the partner
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        partnerUserId: partnerUser.id,
        subscriptionTier: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE'][Math.floor(Math.random() * 3)],
        subscriptionStatus: 'ACTIVE',
        nextBillingDate: new Date(year, monthIndex + 1, 1),
        createdAt: signupDate,
        updatedAt: signupDate,
      },
    });
    
    // Update partner user to have tenantId
    await prisma.user.update({
      where: { id: partnerUser.id },
      data: { tenantId: tenant.id },
    });
    
    partnerCount++;
  }
  
  console.log(`✅ Created ${partnerCount} recent partners`);
  return partnerCount;
}

// Add recent customers (2 per month for last 3 months)
async function addRecentCustomers() {
  console.log('👤 Adding recent customers (2 per month for last 3 months)...');
  
  const currentDate = new Date();
  const months = [];
  
  // Get last 3 months
  for (let i = 2; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    months.push(date);
  }
  
  // Get all tenants to assign customers to
  const tenants = await prisma.tenant.findMany();
  
  let customerCount = 0;
  
  for (const month of months) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    console.log(`Creating 2 customers for ${month.toLocaleString('default', { month: 'long', year: 'numeric' })}...`);
    
    for (let i = 0; i < 2; i++) {
      const firstName = additionalCustomerNames[customerCount % additionalCustomerNames.length];
      const lastName = additionalCustomerSurnames[Math.floor(Math.random() * additionalCustomerSurnames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = generateEmail(fullName, customerCount + 20000); // Use high number to avoid conflicts
      const mobile = generatePhone();
      const signupDate = randomDateInMonth(year, monthIndex);
      const tenant = tenants[Math.floor(Math.random() * tenants.length)];
      
      await prisma.customer.create({
        data: {
          name: fullName,
          email: email,
          mobile: mobile,
          tenantId: tenant.id,
          createdAt: signupDate,
          updatedAt: signupDate,
        },
      });
      
      customerCount++;
    }
  }
  
  console.log(`✅ Created ${customerCount} recent customers`);
  return customerCount;
}

// Add transactions where each customer interacts with each partner once a month
async function addRecentTransactions() {
  console.log('💰 Adding transactions (each customer with each partner once a month)...');
  
  // Get all customers created in the last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentCustomers = await prisma.customer.findMany({
    where: {
      createdAt: {
        gte: threeMonthsAgo
      }
    },
    include: {
      tenant: true
    }
  });
  
  // Get all tenants (partners)
  const allTenants = await prisma.tenant.findMany();
  
  let transactionCount = 0;
  
  for (const customer of recentCustomers) {
    const customerSignupDate = customer.createdAt;
    const currentDate = new Date();
    
    // Calculate months between signup and now
    const monthsDiff = (currentDate.getFullYear() - customerSignupDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - customerSignupDate.getMonth());
    
    const monthsToProcess = Math.min(monthsDiff, 3); // Last 3 months
    
    for (let month = 0; month < monthsToProcess; month++) {
      const transactionDate = new Date(customerSignupDate.getFullYear(), customerSignupDate.getMonth() + month, 1);
      
      // Each customer interacts with each partner once this month
      for (const tenant of allTenants) {
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
            tenantId: tenant.id,
            userId: tenant.partnerUserId,
            status: 'completed',
            type: 'purchase',
            createdAt: transactionDateTime,
            updatedAt: transactionDateTime,
          }
        });
        
        transactionCount++;
      }
    }
    
    if (transactionCount % 1000 === 0) {
      console.log(`Created ${transactionCount} transactions so far...`);
    }
  }
  
  console.log(`✅ Created ${transactionCount} recent transactions`);
  return transactionCount;
}

// Main function
async function main() {
  console.log('🌱 Adding recent data to database...');
  console.log('📅 Adding data for last 3 months');
  console.log('👥 1 partner per month');
  console.log('👤 2 customers per month');
  console.log('💰 Each customer interacts with each partner once per month');
  console.log('💷 Average purchase amount: £127\n');
  
  try {
    const partnerCount = await addRecentPartners();
    const customerCount = await addRecentCustomers();
    const transactionCount = await addRecentTransactions();
    
    console.log('\n🎉 Recent data addition completed successfully!');
    
    // Print summary
    const totalUsers = await prisma.user.count();
    const totalTenants = await prisma.tenant.count();
    const totalCustomers = await prisma.customer.count();
    const totalTransactions = await prisma.transaction.count();
    
    console.log('\n📊 Updated Database Summary:');
    console.log(`👥 Total Users: ${totalUsers}`);
    console.log(`🏢 Total Tenants: ${totalTenants}`);
    console.log(`👤 Total Customers: ${totalCustomers}`);
    console.log(`💰 Total Transactions: ${totalTransactions}`);
    
    console.log('\n📈 Recent Data Added:');
    console.log(`👥 New Partners: ${partnerCount}`);
    console.log(`👤 New Customers: ${customerCount}`);
    console.log(`💰 New Transactions: ${transactionCount}`);
    
    // Calculate average transaction amount
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      select: { amount: true }
    });
    
    if (recentTransactions.length > 0) {
      const avgAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length;
      console.log(`💷 Average Transaction Amount: £${avgAmount.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error adding recent data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
