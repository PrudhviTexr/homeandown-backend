# Deployment Instructions for GoDaddy

## Package Ready
- **File**: `homeandown-deployment.zip`
- **Size**: ~2.1 MB
- **Location**: Project root directory

## What's Included in the Zip

1. **dist/** - Built frontend application (production-ready)
2. **python_api/** - Backend application (Python/FastAPI)
3. **package.json** - Frontend dependencies (for reference)
4. **README.md** - Project documentation
5. **render.yaml** - Deployment configuration (for Render.com, can adapt for GoDaddy)

## Deployment Options

### Option 1: Static Frontend on GoDaddy Hosting

#### Step 1: Extract and Upload Frontend
1. Extract `homeandown-deployment.zip`
2. Upload the contents of the `dist` folder to your GoDaddy hosting via FTP/cPanel File Manager
3. Access your site at your domain

#### Step 2: Backend Deployment
The backend needs to be deployed separately since GoDaddy hosting typically doesn't support Python applications. Options:

**A. Deploy Backend to Render.com (Recommended)**
- Sign up at render.com (free tier available)
- Upload the `python_api` folder
- Set up environment variables
- Render will provide you with a backend URL (e.g., `https://your-app.onrender.com`)

**B. Use Supabase Edge Functions**
- The backend can be partially migrated to Supabase Edge Functions
- Some functionality already exists in `supabase/functions/`

### Option 2: VPS/Cloud Hosting (Full Stack)

#### If Using a VPS (AWS, DigitalOcean, etc.):

1. **Upload Files via SCP/FTP**
   ```bash
   scp -r homeandown-deployment.zip user@your-server:/var/www/
   ```

2. **On Server, Extract and Setup**
   ```bash
   cd /var/www
   unzip homeandown-deployment.zip
   cd homeandown-28oct-supabase-storage-service
   ```

3. **Install Backend Dependencies**
   ```bash
   cd python_api
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials
   - Set `VITE_PY_API_URL` to your backend URL

5. **Setup Frontend**
   - Serve the `dist` folder with nginx or Apache
   - Configure reverse proxy for backend API

6. **Run Backend**
   ```bash
   # Using gunicorn (production)
   gunicorn app.main:app -c gunicorn.conf.py
   
   # Or using uvicorn (development)
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

7. **Setup Nginx Configuration**
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           root /var/www/homeandown-deployment/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   
   # Backend API (optional if hosting locally)
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Environment Variables

Create a `.env` file in `python_api/` with:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Key
PYTHON_API_KEY=your_random_secret_key

# Email Configuration (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend
VITE_PY_API_URL=https://your-backend-url.com
VITE_PYTHON_API_KEY=your_random_secret_key
```

## Database Migration

Don't forget to apply the migration for document status:

```sql
-- Run this in your Supabase SQL editor
ALTER TABLE IF EXISTS public.documents
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON public.documents(entity_type);
CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON public.documents(entity_id);
```

## Recommended Architecture

```
┌─────────────────┐
│  GoDaddy Hosting │
│   (Frontend)     │ ──dist folder
│   yourdomain.com │
└────────┬─────────┘
         │ API Calls
         ↓
┌─────────────────┐
│  Render/VPS     │
│   (Backend)      │ ──python_api
│  api.yd.com     │
└────────┬─────────┘
         │ Database
         ↓
┌─────────────────┐
│    Supabase     │
│    Database     │
└─────────────────┘
```

## Troubleshooting

### Frontend 404 Errors
- Ensure `.htaccess` or nginx configuration redirects all routes to `index.html`
- Check that all API calls are going to the correct backend URL

### Backend Connection Issues
- Verify `VITE_PY_API_URL` environment variable
- Check CORS settings in backend
- Ensure API key is configured correctly

### Database Issues
- Run the SQL migration for document status
- Verify Supabase connection credentials
- Check RLS policies on tables

## Quick Deploy Checklist

- [ ] Extract deployment zip
- [ ] Upload dist folder to GoDaddy hosting
- [ ] Deploy backend to Render.com or VPS
- [ ] Configure environment variables
- [ ] Run database migration
- [ ] Test frontend-backend connection
- [ ] Verify all API endpoints working
- [ ] Test document upload/approval functionality
- [ ] Test property creation flow
- [ ] Test user authentication

## Support

For issues or questions, refer to:
- README.md in the project
- Documentation files in the repo
- Supabase dashboard for database management

