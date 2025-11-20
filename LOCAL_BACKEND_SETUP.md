# Local Backend Setup Guide

## Prerequisites

You need Python 3.9+ with pip installed on your local machine.

## Steps to Run Backend Locally

### 1. Install Python Dependencies

```bash
cd python_api
pip install -r requirements.txt
```

Or if using a virtual environment (recommended):

```bash
cd python_api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Verify Environment Variables

Make sure the `.env` file in the project root has the following configured:

```
SUPABASE_URL=https://ajymffxpunxoqcmunohx.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
PYTHON_API_KEY=g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj
```

### 3. Start the Backend Server

```bash
cd python_api
python -m uvicorn app.main:app --reload --port 8000
```

Or use the provided scripts:
- Windows: `start-backend.ps1`
- Linux/Mac: Create a similar bash script

The backend will start at: **http://127.0.0.1:8000**

### 4. Update Frontend Configuration

Edit the `.env` file in the project root:

```bash
# Change this line:
VITE_PY_API_URL=https://homeandown-backend.onrender.com

# To this:
VITE_PY_API_URL=http://127.0.0.1:8000
```

### 5. Restart Frontend Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 6. Verify Connection

Open your browser to http://localhost:8082 and check:
- Properties are loading
- No CORS errors in browser console
- Backend API docs at http://127.0.0.1:8000/docs

## Troubleshooting

### CORS Errors
The backend CORS configuration already includes localhost ports. If you still see CORS errors, verify:
- Backend is running on port 8000
- Frontend is running on port 8082
- Both are using http:// (not https://)

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check internet connection (Supabase is cloud-hosted)
- Check backend console logs for detailed error messages

### Port Already in Use
If port 8000 is already taken:
```bash
# Use a different port
python -m uvicorn app.main:app --reload --port 8001

# Update .env accordingly:
VITE_PY_API_URL=http://127.0.0.1:8001
```

## Current Status

**Note:** The current build environment doesn't have pip installed, so the backend is currently using the remote Render deployment at:
- **https://homeandown-backend.onrender.com**

This remote backend is fully functional and connected to the same Supabase database. You can develop frontend features without running the backend locally. Only run the backend locally when you need to:
- Test backend API changes
- Debug backend issues
- Develop new API endpoints

## Backend Development

When developing backend features:

1. Make changes in `python_api/app/` directory
2. Test locally with local backend running
3. Commit changes to Git
4. Push to trigger Render deployment
5. Render will automatically deploy the new backend code

The remote backend at Render stays in sync with your Git repository.
