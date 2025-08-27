const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // Add UUID generation

exports.seed = async function(knex) {
  // Clear existing data
  await knex('ai_conversations').del();
  await knex('goals').del();
  await knex('bills').del();
  await knex('transactions').del();
  await knex('accounts').del();
  await knex('subscriptions').del();
  await knex('plaid_items').del();
  await knex('users').del();

  // Create sample user
  const passwordHash = await bcrypt.hash('password123', 10);
  const userId = uuidv4(); // Generate UUID manually
  
  const [user] = await knex('users').insert({
    id: userId, // Explicitly set ID
    email: 'demo@budgetapp.com',
    password_hash: passwordHash,
    first_name: 'Demo',
    last_name: 'User',
    subscription_tier: 'premium'
  }).returning('*');

  console.log('✅ Created demo user:', user.email);

  // Create sample accounts with explicit IDs
  const checkingId = uuidv4();
  const savingsId = uuidv4();
  const creditId = uuidv4();
  
  const accounts = await knex('accounts').insert([
    {
      id: checkingId,
      user_id: user.id,
      name: 'Chase Checking',
      type: 'checking',
      balance: 2500.00,
      currency: 'USD'
    },
    {
      id: savingsId,
      user_id: user.id,
      name: 'Savings Account',
      type: 'savings',
      balance: 8750.00,
      currency: 'USD'
    },
    {
      id: creditId,
      user_id: user.id,
      name: 'Credit Card',
      type: 'credit',
      balance: -850.00,
      currency: 'USD'
    }
  ]).returning('*');

  console.log('✅ Created sample accounts');

  // Create sample transactions
  const checkingAccount = accounts.find(acc => acc.type === 'checking');
  const transactions = [];
  
  // Generate transactions for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    transactions.push({
      id: uuidv4(), // Add explicit ID
      user_id: user.id,
      account_id: checkingId, // Use explicit account ID
      amount: -Math.random() * 100 - 10, // Random expense
      description: `Transaction ${i + 1}`,
      category: ['food', 'transportation', 'entertainment', 'utilities'][Math.floor(Math.random() * 4)],
      date: date.toISOString().split('T')[0]
    });
  }

  // Add income transaction with explicit ID
  transactions.push({
    id: uuidv4(),
    user_id: user.id,
    account_id: checkingId,
    amount: 3000.00,
    description: 'Salary Deposit',
    category: 'income',
    date: new Date().toISOString().split('T')[0]
  });

  await knex('transactions').insert(transactions);
  console.log('✅ Created sample transactions');

  // Create sample bills with explicit IDs
  await knex('bills').insert([
    {
      id: uuidv4(),
      user_id: user.id,
      name: 'Rent',
      amount: 1200.00,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      frequency: 'monthly'
    },
    {
      id: uuidv4(),
      user_id: user.id,
      name: 'Electric Bill',
      amount: 85.00,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      frequency: 'monthly'
    }
  ]);

  console.log('✅ Created sample bills');

  // Create sample goals with explicit IDs
  await knex('goals').insert([
    {
      id: uuidv4(),
      user_id: user.id,
      name: 'Emergency Fund',
      target_amount: 10000.00,
      current_amount: 3500.00,
      monthly_target: 500.00
    },
    {
      id: uuidv4(),
      user_id: user.id,
      name: 'Vacation',
      target_amount: 2000.00,
      current_amount: 750.00,
      monthly_target: 200.00,
      target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months from now
    }
  ]);

  console.log('✅ Created sample goals');
  console.log('🎉 Sample data setup complete!');
  console.log('📧 Demo login: demo@budgetapp.com / password123');
};
