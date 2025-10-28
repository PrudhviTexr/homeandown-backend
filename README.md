# Home & Own - Property Management System


- `/src` - React frontend code (TypeScript)
- `SECURITY.md` - Comprehensive security documentation
- `.env.example` - Environment variables template

### Prerequisites
git clone <repository-url>
cd homeandownfinal

# Install dependencies
npm install

# Set up environment variables (REQUIRED)
# Create .env file with your credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key

# Run the database migration
# Copy the contents of supabase/migrations/complete_schema_setup.sql
# and run it in your Supabase SQL editor

# Run the email verification migration
# Copy the contents of supabase/migrations/email_verification_tokens.sql
# and run it in your Supabase SQL editor

# Start development server
npm run dev

# Build for production
npm run build
npm run preview
```
### Database Setup (REQUIRED)

1. **Create a Supabase project** at https://supabase.com
2. **Run the migration**: Copy the contents of `supabase/migrations/20250730231615_morning_shore.sql` and execute it in your Supabase SQL editor
3. **Run email verification migration**: Copy the contents of `supabase/migrations/email_verification_tokens.sql` and execute it in your Supabase SQL editor
4. **Set environment variables**: Add your Supabase URL and anon key to `.env`
5. **Configure email provider**: Choose and configure one of the supported email providers (see Environment Variables section)
6. **Verify setup**: The application will now use real database data instead of mock data

### Email Verification Setup (REQUIRED)

This application uses **Resend** for transactional email verification. The custom email verification flow is fully implemented and production-ready.

#### Email Verification Features:
- **Custom verification tokens** stored securely in Supabase
- **Professional HTML email templates** with responsive design
- **24-hour token expiration** for security
- **Automatic fallback** to console logging in development
- **Resend integration** for reliable email delivery
- **Email verification required** for user login access

#### Setup Instructions:

1. **Get Resend API Key**:
 Deployment
 - See DEPLOYMENT_GODADDY.md for cPanel/GoDaddy steps: mount Python API at /api with Passenger and upload dist/ to public_html.
 - In production, the frontend calls same-origin /api (no CORS). Do not set VITE_PY_API_URL in prod.
   - Sign up at https://resend.com
   - Get your API key from the dashboard
   - Add `RESEND_API_KEY` to your `.env` file

2. **Environment Variables**:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   RESEND_API_KEY=your_resend_api_key
   ```

3. **Database Setup**:
   - Run the email verification migration from `supabase/migrations/email_verification_tokens.sql`
   - This creates the necessary database functions and tables

4. **Email Verification Flow**:
   - User signs up → Verification email sent via Resend
   - User clicks link → Token verified in database
   - User can now sign in → Access granted to protected features
   - Unverified users cannot sign in

**Note**: In development mode, verification links are also logged to the console if Resend is not configured.

## 🔐 Security Features

### Input Sanitization
- **DOMPurify integration** for XSS prevention
- Sanitization utilities in `src/utils/sanitize.ts`
- Form data validation and cleaning

### Environment Security
- ✅ No hardcoded credentials in source code
- ✅ Environment variables properly configured
- ✅ Separate development and production configurations
- ✅ Secure password hashing with bcrypt
- ✅ Session management and token validation

### Vulnerability Management
```bash
# Run security audit
npm run audit

# Fix auto-fixable vulnerabilities
npm run audit:fix

# Complete security check
npm run security:check
```

### Role-Based Access Control
- **Protected routes** with role validation
- **Conditional content rendering** based on user roles
- Authentication context with user type checking

```typescript
import { ProtectedRoute, RoleBasedAccess } from './components/auth/ProtectedRoute';

// Protect entire routes
<ProtectedRoute allowedRoles={['admin', 'agent']}>
  <AdminDashboard />
</ProtectedRoute>

// Conditional content
<RoleBasedAccess allowedRoles={['seller']}>
  <AddPropertyButton />
</RoleBasedAccess>
```

## 📱 Responsive Design & Accessibility

### Responsive Features
- ✅ Mobile-first design with Tailwind CSS
- ✅ Responsive breakpoints for mobile, tablet, desktop
- ✅ Touch-friendly interface elements
- ✅ Optimized images and layouts

### Accessibility Features
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management and indicators
- ✅ Semantic HTML structure

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main tables:

- **users**: User accounts with role-based access
- **properties**: Property listings with full details
- **inquiries**: Customer inquiries and agent assignments
- **bookings**: Property tour bookings
- **agent_profiles**: Extended agent information
- **seller_profiles**: Seller verification and business details
- **notifications**: Real-time notifications system
- **documents**: File uploads and document management

All tables include:
- Row Level Security (RLS) policies
- Custom ID generation
- Audit trails with created_at/updated_at
- Proper foreign key relationships

### Accessibility Checklist

- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **Screen Readers**: Proper ARIA labels and semantic markup
- [ ] **Color Contrast**: WCAG AA compliance (4.5:1 ratio minimum)
- [ ] **Focus Indicators**: Visible focus states on all interactive elements
- [ ] **Alt Text**: Descriptive alt text for all images
- [ ] **Form Labels**: Proper labeling for all form inputs
- [ ] **Heading Structure**: Logical heading hierarchy (h1-h6)
- [ ] **Error Messages**: Clear, descriptive error messages
- [ ] **Loading States**: Accessible loading indicators
- [ ] **Navigation**: Consistent and predictable navigation patterns

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint

# Security
npm run audit           # Check for vulnerabilities
npm run audit:fix       # Fix auto-fixable issues
npm run security:check  # Complete security audit
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Verification Configuration (REQUIRED FOR PRODUCTION)
RESEND_API_KEY=your_resend_api_key
```

**Important Notes**:
- These environment variables are REQUIRED for the application to work with real data and email verification
- The application will NOT use mock/dummy data - all data comes from Supabase
- Email verification is required for user access - unverified users cannot sign in
- Resend is pre-configured and ready for production use

## 🚀 Production Deployment

### Environment Setup

1. **Copy environment template:**
   ```bash
   # Create .env.production with your production Supabase credentials
   ```

2. **Configure production variables:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   ```

3. **Database Migration:**
   - Run the complete schema setup in your production Supabase instance
   - Verify all tables and policies are created correctly

### Deployment Platforms

### Deployment Platforms

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
npm run build
netlify deploy --prod --dir=dist

# Set environment variables
netlify env:set VITE_SUPABASE_URL "your_url"
netlify env:set VITE_SUPABASE_ANON_KEY "your_key"
netlify env:set RESEND_API_KEY "your_resend_key"
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables via dashboard or CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
```

#### Important: Production Configuration

1. **Email Verification**: 
   - Resend is pre-configured and ready for production
   - Add your `RESEND_API_KEY` to environment variables
   - Email verification is required for all users

2. **Database**: 
   - Run the complete schema setup in your production Supabase instance
   - Run the email verification migration
   - Verify all tables and policies are created correctly

3. **No Mock Data**:
   - All mock/dummy data has been removed
   - Application uses only live data from Supabase
   - Empty states are handled gracefully when no data exists

### HTTPS Enforcement

All major hosting platforms (Netlify, Vercel, GitHub Pages) automatically provide SSL certificates. For custom configurations, see `SECURITY.md`.

## 🧪 Testing

### Test Infrastructure Setup

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest vitest

# Run tests (when available)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Guidelines

- **Unit Tests**: Test individual components and utilities
- **Integration Tests**: Test component interactions
- **Accessibility Tests**: Use @testing-library/jest-dom for a11y testing
- **Security Tests**: Validate input sanitization and auth flows

## 🏢 User Roles & Features

### Admin
- Dashboard with system overview
- User management (create, edit, delete users)
- Property management (approve/reject listings)
- Analytics and reporting
- System configuration

### Agent
- Personal dashboard with assigned properties
- Lead management and inquiry handling
- Performance metrics
- Client communication tools

### Seller
- Property listing management
- Inquiry and booking tracking
- Performance analytics
- Profile management

### Buyer
- Property search and filtering
- Saved properties and favorites
- Booking management
- Inquiry tracking

## 🔄 Real-time Features

- **Live Search**: Real-time property search with filters
- **Instant Updates**: Property listings update in real-time
- **Notifications**: Real-time notifications for inquiries and bookings
- **Dashboard Updates**: Live dashboard data for all user types
- **Form Validation**: Real-time form validation and error handling

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the database migration from `supabase/migrations/complete_schema_setup.sql`
3. Verify all tables and RLS policies are created
4. Add your project URL and anon key to `.env`
5. Test the connection by running the application

### Database Schema

Key tables:
- `users` - User profiles with role-based access and custom IDs
- `properties` - Property listings with full details and ownership
- `inquiries` - Customer inquiries with agent assignments
- `bookings` - Property tour bookings and scheduling
- `agent_profiles` - Extended agent information and specializations
- `seller_profiles` - Seller verification and business details
- `notifications` - Real-time notification system
- `documents` - File uploads and document management

## 📚 Documentation

- **Security**: See `SECURITY.md` for comprehensive security guidelines
- **Components**: Component documentation in respective source files
- **Deployment**: Platform-specific deployment guides
- **Database**: Schema documentation in migration files

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase URL and key are correct
2. **Migration Issues**: Run the complete schema setup in Supabase SQL editor
3. **Authentication Problems**: Verify user table exists and has sample data
4. **Search Not Working**: Check if properties table has data
5. **Build Errors**: Ensure all environment variables are set

### Getting Help

1. Check existing documentation
2. Review error logs and console output
3. Verify environment configuration
4. Ensure database migration is complete
4. Test with minimal reproduction case

## 🤝 Contributing

1. Follow the established code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure accessibility compliance
5. Run security audits before submitting
6. Test with real database data

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.