const knex = require('knex');
const crypto = require('crypto');

const isLocalOnly = process.env.LOCAL_ONLY_MODE === 'true';
const encryptionKey = process.env.LOCAL_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

let config;

if (isLocalOnly) {
  // SQLite for local-only mode
  config = {
    client: 'sqlite3',
    connection: {
      filename: process.env.LOCAL_DB_PATH || './data/budget_app.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  };
} else {
  // PostgreSQL for cloud mode
  config = {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'budgetuser',
      password: process.env.DB_PASSWORD || 'budgetpass123',
      database: process.env.DB_NAME || 'budget_app'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './src/migrations'
    },
    seeds: {
      directory: './src/seeds'
    }
  };
}

const db = knex(config);

// Encryption utilities for sensitive data
const encrypt = (text) => {
  if (!text || !isLocalOnly) return text;
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (encryptedText) => {
  if (!encryptedText || !isLocalOnly) return encryptedText;
  
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  
  // Check if this is new format (with IV) or old format
  if (encryptedText.includes(':')) {
    // New format with IV
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } else {
    // Old format - return as is for now, or attempt old decryption method
    // For safety, just return the encrypted text if we can't decrypt it
    console.warn('Found old encryption format, returning encrypted text as-is');
    return encryptedText;
  }
};

// Test connection on startup
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log(`📊 Database type: ${isLocalOnly ? 'SQLite (Local)' : 'PostgreSQL'}`);
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    if (isLocalOnly) {
      console.log('💡 Check if data directory exists and is writable');
    } else {
      console.log('💡 Make sure PostgreSQL is running and accessible');
    }
  });

module.exports = { db, encrypt, decrypt, isLocalOnly };
