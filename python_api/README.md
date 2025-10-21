# Homeandown Backend API

A FastAPI-based backend service for the Homeandown property management platform.

## Features

- **FastAPI** - Modern, fast web framework for building APIs
- **Supabase** - Database and authentication
- **JWT Authentication** - Secure user authentication
- **Email Integration** - Gmail SMTP for notifications
- **Property Management** - CRUD operations for properties
- **User Management** - Admin, agent, and client roles
- **File Uploads** - Image and document handling
- **CORS Support** - Cross-origin resource sharing

## Quick Start

### Prerequisites

- Python 3.11+
- Supabase account
- Gmail account (for email notifications)

### Installation

1. Clone the repository:
```bash
git clone git@github.com:PrudhviTexr/homeandown-backend.git
cd homeandown-backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. Run the development server:
```bash
python run_dev.py
```

The API will be available at `http://localhost:8000`

## API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

## Environment Variables

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key
PYTHON_API_KEY=your_api_key

# Email
GMAIL_USERNAME=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Application
SITE_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
```

## Deployment

### Render Deployment

This backend is configured for easy deployment on Render:

1. **Build Command**: `pip install -r requirements_render.txt`
2. **Start Command**: `python run_render.py`
3. **Environment**: Python 3.11

### Environment Variables for Production

Set these in your Render service:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `PYTHON_API_KEY`
- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`
- `FRONTEND_URL`
- `CORS_ORIGIN`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Properties
- `GET /api/properties` - List properties
- `GET /api/properties/{id}` - Get property details
- `POST /api/properties` - Create property (admin/agent)
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property

### Admin
- `GET /admin/users` - List all users
- `GET /admin/stats` - Get platform statistics
- `POST /admin/users/{id}/activate` - Activate user

## Project Structure

```
python_api/
├── app/
│   ├── core/           # Core configuration and utilities
│   ├── db/             # Database models and client
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic services
│   └── main.py         # FastAPI application
├── requirements.txt    # Development dependencies
├── requirements_render.txt  # Production dependencies
├── run_dev.py         # Development server
├── run_render.py      # Production server
└── render.yaml        # Render configuration
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black app/
isort app/
```

### Type Checking
```bash
mypy app/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.