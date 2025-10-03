// Simple script to initialize pending transactions
// Run with: node scripts/init-pending.js

// Mock the database structure
let pendingTransactionsDatabase = {};
let pointsDatabase = {};

function initializeSamplePendingTransactions() {
  console.log('Initializing sample pending transactions...');
  
  const customerEmails = [
    'john.doe@example.com',
    'jane.smith@example.com', 
    'mike.johnson@example.com',
    'sarah.wilson@example.com',
    'david.brown@example.com',
    'emma.davis@example.com',
    'alex.miller@example.com',
    'lisa.garcia@example.com',
    'tom.rodriguez@example.com',
    'anna.martinez@example.com'
  ];

  const storeNames = [
    'Tesco Express',
    'Sainsbury\'s Local',
    'Co-op Food',
    'Morrisons Daily',
    'ASDA Express',
    'Waitrose & Partners',
    'M&S Simply Food',
    'Aldi',
    'Lidl',
    'Iceland'
  ];

  const receiptDescriptions = [
    'Grocery shopping',
    'Weekly food shop',
    'Household essentials',
    'Fresh produce',
    'Dairy and bread',
    'Snacks and drinks',
    'Cleaning supplies',
    'Personal care items',
    'Pet food and supplies',
    'Home and garden'
  ];

  // Create 100 pending transactions (10 per customer)
  for (let i = 0; i < 100; i++) {
    const customerEmail = customerEmails[i % customerEmails.length];
    const storeName = storeNames[Math.floor(Math.random() * storeNames.length)];
    const description = receiptDescriptions[Math.floor(Math.random() * receiptDescriptions.length)];
    const amount = Math.round((Math.random() * 50 + 5) * 100) / 100; // £5-55
    const points = Math.floor(amount * 10); // 10 points per £1
    
    // Generate a random date within the last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const pendingTransaction = {
      id: `pending_${Date.now()}_${i}`,
      customerEmail,
      date: date.toISOString(),
      points,
      description: `${description} at ${storeName} - £${amount.toFixed(2)}`,
      amount,
      receiptImage: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=`,
      status: 'PENDING',
      adminNotes: ''
    };

    if (!pendingTransactionsDatabase[customerEmail]) {
      pendingTransactionsDatabase[customerEmail] = [];
    }
    
    pendingTransactionsDatabase[customerEmail].push(pendingTransaction);
  }

  console.log(`Created ${100} pending transactions for ${customerEmails.length} customers`);
  
  // Also initialize some points for these customers
  customerEmails.forEach(email => {
    if (!pointsDatabase[email]) {
      pointsDatabase[email] = Math.floor(Math.random() * 500) + 100; // 100-600 points
    }
  });

  console.log('Sample data initialized successfully!');
  console.log('Customer emails with pending transactions:');
  customerEmails.forEach(email => {
    const count = pendingTransactionsDatabase[email]?.length || 0;
    console.log(`- ${email}: ${count} pending transactions, ${pointsDatabase[email]} points`);
  });
}

// Run the initialization
initializeSamplePendingTransactions(); 