# Google Maps API Integration Guide

## Overview
This application now supports Google Maps API for accurate location data, including:
- **Geocoding**: Convert addresses/pincodes to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Place Autocomplete**: Get address suggestions as user types
- **Place Details**: Get detailed information about a selected place

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Geocoding API**
   - **Places API**
   - **Maps JavaScript API** (for frontend map picker)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Configure Backend

Add the API key to your backend environment variables:

**For Windows (PowerShell):**
```powershell
$env:GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
```

**For Linux/Mac:**
```bash
export GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
```

**Or add to `.env` file in `python_api/` directory:**
```
GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### 3. API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain (e.g., `https://homeandown.com/*`)
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: Geocoding API, Places API, Maps JavaScript API
5. Save changes

### 4. Frontend Configuration

For the map picker component, you'll need to add the Google Maps script to your HTML:

**In `index.html` or your main HTML file:**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

**Or use environment variable:**
```html
<script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`}></script>
```

Add to your `.env` file:
```
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

## How It Works

### Priority Order

The system now uses the following priority for location data:

1. **Google Maps API** (Primary - Most Accurate)
   - Used for geocoding pincodes
   - Used for reverse geocoding coordinates
   - Used for place autocomplete
   - Provides accurate coordinates and address components

2. **Free APIs** (Fallback)
   - `api.postalpincode.in` - For pincode data
   - OpenStreetMap Nominatim - For coordinates
   - Used only if Google Maps is unavailable or fails

3. **Hardcoded Fallback Data**
   - Common pincodes with known coordinates
   - Used as last resort

### Backend API Endpoints

#### 1. Geocode Address
```http
POST /api/properties/geocode/address
Content-Type: application/json

{
  "address": "500090, Hyderabad, Telangana"
}
```

Response:
```json
{
  "success": true,
  "location": {
    "latitude": 17.3850,
    "longitude": 78.4867,
    "formatted_address": "Hyderabad, Telangana 500090, India",
    "pincode": "500090",
    "city": "Hyderabad",
    "district": "Hyderabad",
    "state": "Telangana",
    "country": "India"
  }
}
```

#### 2. Reverse Geocode
```http
POST /api/properties/geocode/reverse
Content-Type: application/json

{
  "latitude": 17.3850,
  "longitude": 78.4867
}
```

Response:
```json
{
  "success": true,
  "location": {
    "latitude": 17.3850,
    "longitude": 78.4867,
    "formatted_address": "Hyderabad, Telangana 500090, India",
    "pincode": "500090",
    "city": "Hyderabad",
    "district": "Hyderabad",
    "state": "Telangana"
  }
}
```

#### 3. Place Autocomplete
```http
GET /api/properties/places/autocomplete?input_text=Hyderabad&country=in
```

Response:
```json
{
  "success": true,
  "suggestions": [
    {
      "place_id": "ChIJx9Lr6tqZyzsR8LR4b8t1x1k",
      "description": "Hyderabad, Telangana, India",
      "structured_formatting": {
        "main_text": "Hyderabad",
        "secondary_text": "Telangana, India"
      }
    }
  ]
}
```

#### 4. Place Details
```http
GET /api/properties/places/{place_id}
```

Response:
```json
{
  "success": true,
  "place": {
    "place_id": "ChIJx9Lr6tqZyzsR8LR4b8t1x1k",
    "name": "Hyderabad",
    "formatted_address": "Hyderabad, Telangana, India",
    "latitude": 17.3850,
    "longitude": 78.4867,
    "pincode": "500001",
    "city": "Hyderabad",
    "district": "Hyderabad",
    "state": "Telangana",
    "country": "India"
  }
}
```

## Benefits

1. **Accurate Pincode Data**: Google Maps provides more accurate pincode-to-location mapping
2. **Better Coordinates**: Precise latitude/longitude for property locations
3. **Address Autocomplete**: Users can search and select addresses easily
4. **Map Picker**: Users can click on a map to set exact property location
5. **Reverse Geocoding**: Convert map clicks to addresses automatically

## Cost Considerations

Google Maps API has a free tier:
- **Geocoding API**: $5 per 1,000 requests (first $200 free per month)
- **Places API**: $17 per 1,000 requests (first $200 free per month)
- **Maps JavaScript API**: $7 per 1,000 requests (first $200 free per month)

**Free Tier**: $200 credit per month (approximately 28,000 geocoding requests)

## Testing

After setup, test the integration:

1. **Test Pincode Geocoding**:
   ```bash
   curl -X GET "http://127.0.0.1:8000/api/properties/pincode/500090/suggestions"
   ```

2. **Test Address Geocoding**:
   ```bash
   curl -X POST "http://127.0.0.1:8000/api/properties/geocode/address" \
     -H "Content-Type: application/json" \
     -d '{"address": "Hyderabad, Telangana"}'
   ```

3. **Test Reverse Geocoding**:
   ```bash
   curl -X POST "http://127.0.0.1:8000/api/properties/geocode/reverse" \
     -H "Content-Type: application/json" \
     -d '{"latitude": 17.3850, "longitude": 78.4867}'
   ```

## Troubleshooting

### API Key Not Working
- Check if API key is set in environment variables
- Verify API key restrictions allow your domain/IP
- Ensure required APIs are enabled in Google Cloud Console

### Rate Limiting
- Google Maps has rate limits
- Implement caching for frequently used pincodes
- Consider using fallback APIs for non-critical requests

### Missing Data
- Some pincodes may not have complete data
- System automatically falls back to free APIs
- Users can manually edit location fields

## Next Steps

1. ✅ Backend Google Maps service created
2. ✅ API endpoints added
3. ✅ Location service updated to use Google Maps
4. ⏳ Frontend map picker component (to be created)
5. ⏳ Frontend autocomplete integration (to be created)

