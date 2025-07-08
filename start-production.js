#!/usr/bin/env node

// Production startup script for Hostinger
console.log('🚀 Starting AUTON® Production Server...');

// Set production environment
process.env.NODE_ENV = 'production';

// Import and start the server
import('./dist/index.js')
  .then(() => {
    console.log('✅ AUTON® Server started successfully');
    console.log('🌐 Server URL: https://458ddcb5-57d1-473b-8847-a21f68742671.dev27.app-preview.com');
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });