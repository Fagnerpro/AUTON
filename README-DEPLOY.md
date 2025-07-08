# AUTON® - Deploy Guide for Hostinger

## 🚀 Production Deployment Steps

### 1. Environment Variables
Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/auton_db
PGHOST=localhost
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=auton_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters

# Environment
NODE_ENV=production
PORT=5000

# Email (for password reset)
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-email-password

# Application
APP_NAME=AUTON®
APP_URL=https://yourdomain.com
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb auton_db

# Run migrations
npm run db:push
```

### 3. Build and Deploy
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

### 4. System Features
✅ Complete authentication system with JWT
✅ User registration and login
✅ Password reset functionality
✅ Subscription plans (Free & Premium)
✅ Solar simulation engine
✅ Report generation (PDF, Excel, JSON)
✅ Multi-unit residential projects
✅ Production-ready (no demo data)

### 5. Default Plans
- **Free Plan**: 5 simulations, basic features
- **Premium Plan**: R$ 24,90/month, unlimited simulations

### 6. Security Notes
- All passwords are hashed with bcrypt
- JWT tokens for secure authentication
- CORS configured for production
- Input validation with Zod schemas
- SQL injection protection with Drizzle ORM

### 7. Monitoring
- Express request logging
- Error handling middleware
- Health check endpoint at `/api/health`

## 📱 System Access
- Landing page with authentication
- Dashboard for logged users
- Simulation modules (Residential, Commercial, EV, Multi-unit)
- Reports and settings pages

## 🔧 Troubleshooting
- Check environment variables are set correctly
- Verify database connection
- Ensure JWT_SECRET is at least 32 characters
- Check PostgreSQL service is running