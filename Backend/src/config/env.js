import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingVars = [];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.error(`❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Align CLIENT_URL and FRONTEND_URL
if (!process.env.CLIENT_URL && process.env.FRONTEND_URL) {
  process.env.CLIENT_URL = process.env.FRONTEND_URL;
}
if (!process.env.FRONTEND_URL && process.env.CLIENT_URL) {
  process.env.FRONTEND_URL = process.env.CLIENT_URL;
}

// Validate production-specific required environment variables
if (process.env.NODE_ENV === 'production') {
  const productionRequiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SERP_API_KEY',
    'RESEND_API_KEY',
    'GEMINI_API_KEY',
  ];

  const missingProdVars = [];
  for (const varName of productionRequiredVars) {
    if (!process.env[varName]) {
      missingProdVars.push(varName);
    }
  }

  if (missingProdVars.length > 0) {
    console.error(`❌ CRITICAL: Missing production-required environment variables: ${missingProdVars.join(', ')}`);
    process.exit(1);
  }
}

console.log('✓ Environment Loaded');
