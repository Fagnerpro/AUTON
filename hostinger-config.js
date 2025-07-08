// Hostinger production configuration
const config = {
  // Server settings
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  
  // Database settings
  database: {
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production',
  },
  
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-minimum-32-chars',
    expiresIn: '7d',
  },
  
  // CORS settings for production
  cors: {
    origin: [
      'https://458ddcb5-57d1-473b-8847-a21f68742671.dev27.app-preview.com',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ],
    credentials: true,
  },
  
  // Security headers
  security: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  },
};

export default config;