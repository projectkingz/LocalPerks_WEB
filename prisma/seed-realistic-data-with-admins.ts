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
  'Megan Morgan', 'Jonathan Bell', 'Lauren Murphy', 'Joshua Bailey', 'Heather Rivera',
  'Brandon Cooper', 'Samantha Richardson', 'Nathan Cox', 'Rebecca Ward', 'Adam Torres',
  'Stephanie Peterson', 'Kevin Gray', 'Nicole Ramirez', 'Steven James', 'Rachel Watson',
  'Brian Brooks', 'Amber Kelly', 'Eric Sanders', 'Kimberly Price', 'Timothy Bennett',
  'Megan Wood', 'Jonathan Barnes', 'Lauren Ross', 'Joshua Henderson', 'Heather Coleman',
  'Brandon Jenkins', 'Samantha Perry', 'Nathan Powell', 'Rebecca Long', 'Adam Patterson',
  'Stephanie Hughes', 'Kevin Flores', 'Nicole Washington', 'Steven Butler', 'Rachel Simmons',
  'Brian Foster', 'Amber Gonzales', 'Eric Bryant', 'Kimberly Alexander', 'Timothy Russell',
  'Megan Griffin', 'Jonathan Diaz', 'Lauren Hayes', 'Joshua Myers', 'Heather Ford',
  'Brandon Hamilton', 'Samantha Graham', 'Nathan Sullivan', 'Rebecca Wallace', 'Adam Woods',
  'Stephanie Cole', 'Kevin West', 'Nicole Jordan', 'Steven Owens', 'Rachel Reynolds',
  'Brian Fisher', 'Amber Ellis', 'Eric Harrison', 'Kimberly Gibson', 'Timothy Mcdonald'
];

// Realistic partner emails
const partnerEmails = partnerNames.map(name => {
  const [first, last] = name.toLowerCase().split(' ');
  return `${first}.${last}@business.com`;
});

// Enhanced meaningful rewards with business-specific rewards
const meaningfulRewards = [
  // Coffee/Drinks
  { name: 'Free Coffee', description: 'Enjoy a free coffee of your choice', points: 50 },
  { name: 'Free Latte', description: 'Treat yourself to a free latte', points: 60 },
  { name: 'Free Cappuccino', description: 'Enjoy a free cappuccino', points: 55 },
  { name: 'Free Smoothie', description: 'Enjoy a refreshing free smoothie', points: 110 },
  { name: 'Free Milkshake', description: 'Treat yourself to a free milkshake', points: 120 },
  
  // Food
  { name: 'Free Pastry', description: 'Treat yourself to a free pastry', points: 75 },
  { name: 'Free Sandwich', description: 'Enjoy a free sandwich of your choice', points: 90 },
  { name: 'Free Pizza Slice', description: 'Get a free pizza slice', points: 85 },
  { name: 'Free Burger', description: 'Enjoy a free burger', points: 150 },
  { name: 'Free Chicken Wings', description: 'Get free chicken wings', points: 130 },
  
  // Discounts
  { name: '10% Discount', description: 'Get 10% off your next purchase', points: 100 },
  { name: '15% Discount', description: 'Get 15% off your next purchase', points: 150 },
  { name: '20% Discount', description: 'Get 20% off your next purchase', points: 200 },
  { name: '25% Discount', description: 'Get 25% off your next purchase', points: 250 },
  { name: '30% Discount', description: 'Get 30% off your next purchase', points: 300 },
  
  // Meals
  { name: 'Free Lunch', description: 'Enjoy a free lunch meal', points: 150 },
  { name: 'Free Dinner', description: 'Enjoy a free dinner meal', points: 180 },
  { name: 'Free Breakfast', description: 'Start your day with a free breakfast', points: 120 },
  { name: 'Free Appetizer', description: 'Start your meal with a free appetizer', points: 80 },
  { name: 'Free Main Course', description: 'Enjoy a free main course', points: 120 },
  { name: 'Free Dessert', description: 'Treat yourself to a free dessert', points: 60 },
  
  // Retail
  { name: 'Free T-Shirt', description: 'Get a free t-shirt', points: 200 },
  { name: 'Free Hat', description: 'Get a free hat', points: 150 },
  { name: 'Free Bag', description: 'Get a free bag', points: 180 },
  { name: 'Free Accessory', description: 'Get a free accessory of your choice', points: 100 },
  
  // Services
  { name: 'Free Gym Session', description: 'Enjoy a free gym session', points: 80 },
  { name: 'Free Movie Ticket', description: 'Get a free movie ticket', points: 120 },
  { name: 'Free Car Wash', description: 'Get a free car wash', points: 90 },
  { name: 'Free Oil Change', description: 'Get a free oil change', points: 200 },
  
  // Drinks
  { name: 'Free Soft Drink', description: 'Enjoy a free soft drink', points: 40 },
  { name: 'Free Beer', description: 'Enjoy a free beer', points: 80 },
  { name: 'Free Wine', description: 'Enjoy a free glass of wine', points: 100 },
  { name: 'Free Cocktail', description: 'Enjoy a free cocktail', points: 120 }
];

// Enhanced customer names with more variety
const customerNames = [
  'Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Brown',
  'Frank Miller', 'Grace Taylor', 'Henry Anderson', 'Ivy Martinez', 'Jack Garcia',
  'Kate Rodriguez', 'Liam Thompson', 'Mia White', 'Noah Harris', 'Olivia Clark',
  'Paul Lewis', 'Quinn Lee', 'Ruby Walker', 'Sam Hall', 'Tina Allen',
  'Uma Young', 'Victor King', 'Wendy Wright', 'Xander Lopez', 'Yara Hill',
  'Zoe Scott', 'Adam Green', 'Bella Adams', 'Charlie Baker', 'Diana Gonzalez',
  'Ella Roberts', 'Frankie Stone', 'Grace Thomas', 'Henry Underwood', 'Isla Vincent',
  'Jack White', 'Kara Xu', 'Liam Young', 'Mona Zimmerman', 'Noah Allen',
  'Olivia Brooks', 'Peter Collins', 'Queenie Diaz', 'Riley Evans', 'Sophie Fisher',
  'Tom Grant', 'Ursula Hayes', 'Vera Irwin', 'Willow Jenkins', 'Ximena Kim',
  'Yusuf Lane', 'Zoey Moore', 'Aisha Patel', 'Benji Cohen', 'Carla Santos',
  'Derek O\'Connor', 'Fatima Al-Zahra', 'Gustavo Silva', 'Hannah Goldstein', 'Igor Petrov',
  'Jasmine Chen', 'Khalil Hassan', 'Luna Rodriguez', 'Marcus Johnson', 'Nadia Kowalski',
  'Oscar Martinez', 'Priya Sharma', 'Quentin Dubois', 'Rosa Fernandez', 'Sven Andersson',
  'Tatiana Ivanova', 'Umar Khan', 'Valentina Rossi', 'Winston Chang', 'Xiaoli Wang',
  'Yuki Tanaka', 'Zara Ahmed', 'Ahmed Hassan', 'Bianca Costa', 'Carlos Mendez',
  'Diana Popov', 'Eduardo Silva', 'Fiona O\'Brien', 'Gabriel Santos', 'Hiroshi Yamamoto',
  'Isabella Romano', 'Javier Morales', 'Katarina Novak', 'Leonardo Ferrari', 'Maria Santos',
  'Nikolai Petrov', 'Olga Kowalczyk', 'Pablo Gonzalez', 'Qing Li', 'Rafael Silva',
  'Sofia Rodriguez', 'Tomas Novak', 'Uma Patel', 'Viktor Ivanov', 'Wendy Chen',
  'Xavier Dubois', 'Yasmine Al-Mahmoud', 'Zachary Goldstein', 'Amina Hassan', 'Boris Petrov',
  'Carmen Rodriguez', 'Dimitri Ivanov', 'Elena Santos', 'Fernando Silva', 'Greta Andersson'
];

const customerEmails = customerNames.map(name => {
  const [first, last] = name.toLowerCase().split(' ');
  return `${first}.${last}@example.com`;
});

// Realistic phone numbers
const phoneNumbers = [
  '07700 900123', '07700 900124', '07700 900125', '07700 900126', '07700 900127',
  '07700 900128', '07700 900129', '07700 900130', '07700 900131', '07700 900132',
  '07700 900133', '07700 900134', '07700 900135', '07700 900136', '07700 900137',
  '07700 900138', '07700 900139', '07700 900140', '07700 900141', '07700 900142',
  '07700 900143', '07700 900144', '07700 900145', '07700 900146', '07700 900147',
  '07700 900148', '07700 900149', '07700 900150', '07700 900151', '07700 900152',
  '07700 900153', '07700 900154', '07700 900155', '07700 900156', '07700 900157',
  '07700 900158', '07700 900159', '07700 900160', '07700 900161', '07700 900162',
  '07700 900163', '07700 900164', '07700 900165', '07700 900166', '07700 900167',
  '07700 900168', '07700 900169', '07700 900170', '07700 900171', '07700 900172',
  '07700 900173', '07700 900174', '07700 900175', '07700 900176', '07700 900177',
  '07700 900178', '07700 900179', '07700 900180', '07700 900181', '07700 900182',
  '07700 900183', '07700 900184', '07700 900185', '07700 900186', '07700 900187',
  '07700 900188', '07700 900189', '07700 900190', '07700 900191', '07700 900192',
  '07700 900193', '07700 900194', '07700 900195', '07700 900196', '07700 900197',
  '07700 900198', '07700 900199', '07700 900200', '07700 900201', '07700 900202',
  '07700 900203', '07700 900204', '07700 900205', '07700 900206', '07700 900207',
  '07700 900208', '07700 900209', '07700 900210', '07700 900211', '07700 900212',
  '07700 900213', '07700 900214', '07700 900215', '07700 900216', '07700 900217',
  '07700 900218', '07700 900219', '07700 900220', '07700 900221', '07700 900222'
];

// Realistic transaction descriptions
const transactionDescriptions = [
  'Coffee purchase', 'Lunch meal', 'Dinner meal', 'Snack purchase', 'Drink purchase',
  'Grocery shopping', 'Clothing purchase', 'Electronics purchase', 'Fuel purchase', 'Movie ticket',
  'Gym membership', 'Restaurant meal', 'Fast food order', 'Retail purchase', 'Service payment',
  'Food delivery', 'Takeaway order', 'Dessert purchase', 'Beverage purchase', 'Merchandise purchase'
];

// Realistic activity descriptions
const activityDescriptions = [
  'Earned points for coffee purchase', 'Redeemed reward for free lunch', 'Earned points for shopping',
  'Redeemed discount on purchase', 'Earned points for fuel', 'Redeemed free dessert',
  'Earned points for meal', 'Redeemed free drink', 'Earned points for retail purchase',
  'Redeemed free appetizer', 'Earned points for service', 'Redeemed free main course',
  'Earned points for delivery', 'Redeemed discount voucher', 'Earned points for membership',
  'Redeemed free snack', 'Earned points for entertainment', 'Redeemed free accessory',
  'Earned points for dining', 'Redeemed free beverage'
];

async function main() {
  try {
    // Hash the password once for all users
    const hashedPassword = await hash(plainPassword, 12);
    
    // Robust cleanup: delete all existing data in the correct order due to foreign key constraints
    await prisma.activity.deleteMany({});
    await prisma.redemption.deleteMany({});
    await prisma.tenantPointsConfig.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.reward.deleteMany({});

    // 1. Create 100 tenants, each with a partner user
    const tenants: { id: string; name: string; partnerUserId: string }[] = [];
    for (let i = 1; i <= 100; i++) {
      // Use realistic business name and partner name
      const businessName = businessNames[i - 1] || `Business ${i}`;
      const partnerName = partnerNames[i - 1] || `Partner ${i}`;
      const partnerEmail = partnerEmails[i - 1] || `partner${i}@business.com`;
      
      let partnerUser = await prisma.user.findUnique({ where: { email: partnerEmail } });
      if (!partnerUser) {
        partnerUser = await prisma.user.create({
          data: {
            name: partnerName,
            email: partnerEmail,
            password: hashedPassword,
            role: 'PARTNER',
            emailVerified: new Date(),
          },
        });
      }
      // Create tenant and link to partner user
      const tenant = await prisma.tenant.create({
        data: {
          name: businessName,
          partnerUserId: partnerUser.id,
        },
      });
      // Update partner user to have tenantId
      await prisma.user.update({
        where: { id: partnerUser.id },
        data: { tenantId: tenant.id },
      });
      tenants.push({ id: tenant.id, name: tenant.name, partnerUserId: partnerUser.id });
    }
    console.log('Created 100 realistic business tenants');

    // 1a. Create super admin and admin users
    console.log('Creating admin users...');
    
    // Create super admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: 'superadmin@localperks.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        emailVerified: new Date(),
        approvalStatus: 'ACTIVE',
      },
    });
    console.log('Created super admin:', superAdmin.email);

    // Create 5 admin users
    const adminUsers = [];
    for (let i = 1; i <= 5; i++) {
      const admin = await prisma.user.create({
        data: {
          name: `Admin User ${i}`,
          email: `admin${i}@localperks.com`,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
          approvalStatus: 'ACTIVE',
        },
      });
      adminUsers.push(admin);
      console.log(`Created admin ${i}:`, admin.email);
    }
    console.log('Created 5 admin users');

    // 1b. Create meaningful rewards
    console.log('Creating meaningful rewards...');
    const rewards: { id: string; points: number }[] = [];
    for (let i = 0; i < 1000; i++) {
      const rewardTemplate = meaningfulRewards[i % meaningfulRewards.length];
      // Assign each reward to a random tenant
      const randomTenant = tenants[getRandomInt(0, tenants.length - 1)];
      const reward = await prisma.reward.create({
        data: {
          name: rewardTemplate.name,
          description: rewardTemplate.description,
          points: rewardTemplate.points,
          tenantId: randomTenant.id,
          createdAt: new Date(),
        },
      });
      rewards.push({ id: reward.id, points: reward.points });
    }
    console.log('Created 1000 meaningful rewards');

    // 1c. Create tenant points configurations
    console.log('Creating tenant points configurations...');
    for (const tenant of tenants) {
      await prisma.tenantPointsConfig.create({
        data: {
          tenantId: tenant.id,
          config: JSON.stringify({
            pointsPerPound: getRandomInt(5, 15),
            minimumPurchase: getRandomInt(1, 10),
            bonusMultiplier: getRandomInt(1, 3),
            expiryDays: getRandomInt(30, 365)
          }),
        },
      });
    }
    console.log('Created tenant points configurations');

    // 2. Create 1000 users, distributed among tenants
    const users: { id: string; tenantId: string }[] = [];
    for (let i = 1; i <= 1000; i++) {
      const tenant = tenants[getRandomInt(0, tenants.length - 1)];
      const user = await prisma.user.create({
        data: {
          name: `User ${i}`,
          email: `user${i}@test.com`,
          password: hashedPassword,
          role: 'CUSTOMER',
          emailVerified: new Date(),
          tenantId: tenant.id,
        },
      });
      users.push({ id: user.id, tenantId: tenant.id });
    }

    // 3. Create 900 customers, each with a corresponding user, distributed among tenants
    const customers: { id: string; userId: string; tenantId: string }[] = [];
    for (let i = 1; i <= 900; i++) {
      const tenant = tenants[getRandomInt(0, tenants.length - 1)];
      // Use realistic name, email, and phone
      const name = customerNames[(i - 1) % customerNames.length];
      const baseEmail = customerEmails[(i - 1) % customerEmails.length];
      const email = baseEmail.replace('@', `${i}@`); // Make email unique
      const phone = phoneNumbers[(i - 1) % phoneNumbers.length];
      
      // Create a user for the customer (this will be used for authentication and transactions)
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CUSTOMER',
          emailVerified: new Date(),
          tenantId: tenant.id,
        },
      });
      
      // Create the customer profile (this will be used for customer-specific data)
      const customer = await prisma.customer.create({
        data: {
          name,
          email,
          mobile: phone,
          points: getRandomInt(0, 1000),
          tenantId: tenant.id,
        },
      });
      
      customers.push({ id: customer.id, userId: user.id, tenantId: tenant.id });
    }
    console.log('Created 900 customers with users');

    // 4. Create 5000 transactions with realistic data
    console.log('Creating transactions...');
    for (let i = 1; i <= 5000; i++) {
      const customer = customers[getRandomInt(0, customers.length - 1)];
      const amount = getRandomAmount();
      const points = Math.floor(amount * getRandomInt(5, 15)); // 5-15 points per pound
      const description = transactionDescriptions[getRandomInt(0, transactionDescriptions.length - 1)];
      
      await prisma.transaction.create({
        data: {
          amount,
          points,
          type: 'EARNED',
          status: 'APPROVED',
          userId: customer.userId,
          customerId: customer.id,
          tenantId: customer.tenantId,
        },
      });
    }
    console.log('Created 5000 transactions');

    // 5. Create 1000 redemptions
    console.log('Creating redemptions...');
    for (let i = 1; i <= 1000; i++) {
      const customer = customers[getRandomInt(0, customers.length - 1)];
      const reward = rewards[getRandomInt(0, rewards.length - 1)];
      
      await prisma.redemption.create({
        data: {
          rewardId: reward.id,
          customerId: customer.id,
          points: reward.points,
        },
      });
    }
    console.log('Created 1000 redemptions');

    // 6. Create 2000 activities with realistic descriptions
    console.log('Creating activities...');
    for (let i = 1; i <= 2000; i++) {
      const user = users[getRandomInt(0, users.length - 1)];
      const activityTypes = ['POINTS_EARNED', 'POINTS_SPENT', 'REWARD_REDEEMED', 'PROFILE_UPDATED'];
      const type = activityTypes[getRandomInt(0, activityTypes.length - 1)];
      const points = getRandomInt(10, 500);
      const description = activityDescriptions[getRandomInt(0, activityDescriptions.length - 1)];
      
      await prisma.activity.create({
        data: {
          type,
          description: description,
          points,
          userId: user.id,
        },
      });
    }
    console.log('Created 2000 activities');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAmount() {
  return Math.round((Math.random() * 100 + 5) * 100) / 100; // £5-£105
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 