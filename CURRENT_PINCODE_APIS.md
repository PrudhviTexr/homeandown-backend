# Current Pincode APIs Being Used

## Overview
The system uses multiple APIs in a priority order to fetch pincode data. Here's the complete list:

## API Priority Order

### 1. **Google Maps Geocoding API** (Primary - If Configured)
- **URL**: `https://maps.googleapis.com/maps/api/geocode/json`
- **Status**: ✅ Integrated (requires API key)
- **Purpose**: Get accurate coordinates and address components
- **Data Provided**:
  - Precise latitude/longitude
  - State (administrative_area_level_1)
  - District (administrative_area_level_2)
  - City (locality/sublocality)
  - Formatted address
- **Accuracy**: ⭐⭐⭐⭐⭐ (Excellent)
- **Cost**: Paid ($5 per 1,000 requests, $200 free/month)
- **When Used**: First priority if `GOOGLE_MAPS_API_KEY` is configured

**Code Location**: `python_api/app/services/google_maps_service.py`

---

### 2. **api.postalpincode.in** (Primary Free API)
- **URL**: `https://api.postalpincode.in/pincode/{pincode}`
- **Status**: ✅ Currently Active (Primary Free API)
- **Purpose**: Get official Indian postal pincode data
- **Data Provided**:
  - City/Area name
  - District
  - State
  - Region, Division, Circle, Block
  - Country
- **Accuracy**: ⭐⭐⭐⭐ (Very Good - Official Indian Postal Data)
- **Cost**: Free
- **Rate Limits**: No official limits (be respectful)
- **When Used**: 
  - Primary source for location data (city, district, state)
  - Fallback if Google Maps is not configured
  - Used to get city/state for coordinate lookup

**Example Request:**
```bash
GET https://api.postalpincode.in/pincode/500090
```

**Example Response:**
```json
{
  "Message": "Number of pincode(s) found:1",
  "Status": "Success",
  "PostOffice": [{
    "Name": "Serilingampally",
    "District": "Hyderabad",
    "State": "Telangana",
    "Country": "India",
    "Region": "Hyderabad",
    "Division": "Hyderabad City",
    "Circle": "Andhra Pradesh",
    "Block": "Serilingampally",
    "Pincode": "500090"
  }]
}
```

**Code Location**: `python_api/app/services/location_service.py` (line 185-203, 446-490)

---

### 3. **OpenStreetMap Nominatim API** (Free Geocoding)
- **URL**: `https://nominatim.openstreetmap.org/search`
- **Status**: ✅ Currently Active (Fallback for coordinates)
- **Purpose**: Get coordinates from pincode or city/state
- **Data Provided**:
  - Latitude/Longitude
  - Address components (limited)
- **Accuracy**: ⭐⭐⭐ (Good)
- **Cost**: Free
- **Rate Limits**: 1 request per second (be respectful)
- **When Used**: 
  - Fallback for getting coordinates when Google Maps unavailable
  - Used to geocode city/state combinations
  - Reverse geocoding (coordinates to address)

**Example Request:**
```bash
GET https://nominatim.openstreetmap.org/search?postalcode=500090&countrycodes=in&format=json&limit=1
```

**Code Location**: `python_api/app/services/location_service.py` (line 149-182, 243-260)

---

### 4. **geocode.xyz** (Secondary Fallback)
- **URL**: `https://geocode.xyz/{pincode},India?json=1`
- **Status**: ✅ Integrated (Last resort)
- **Purpose**: Get coordinates as last resort
- **Data Provided**: Latitude/Longitude only
- **Accuracy**: ⭐⭐ (Limited)
- **Cost**: Free (with rate limits)
- **When Used**: Only if all other APIs fail

**Code Location**: `python_api/app/services/location_service.py` (line 206-223)

---

## Current Flow for Pincode Lookup

### For Complete Location Data (get_pincode_location_data):

1. **Try Google Maps** (if API key configured)
   - ✅ Most accurate
   - ✅ Complete address components
   - ✅ Precise coordinates

2. **Try api.postalpincode.in** (Free, Official)
   - ✅ Official Indian postal data
   - ✅ Complete location hierarchy
   - ⚠️ Doesn't provide coordinates directly
   - Uses city/state to get coordinates from Nominatim

3. **Try Hardcoded Fallback Data**
   - Common pincodes with known coordinates
   - Last resort

### For Coordinates Only (get_coordinates_from_pincode):

1. **Check Database Cache** (pincode_locations table)
   - Fastest - no API call needed
   - Previously fetched data

2. **Try Google Maps** (if API key configured)
   - Most accurate coordinates

3. **Try OpenStreetMap Nominatim**
   - Free geocoding
   - Good accuracy

4. **Try api.postalpincode.in + Nominatim**
   - Get city/state from postal API
   - Geocode city/state to get coordinates

5. **Try geocode.xyz**
   - Last resort

## Summary

### Currently Active APIs:

| API | Status | Purpose | Cost |
|-----|--------|---------|------|
| **api.postalpincode.in** | ✅ **PRIMARY** | Location data (city, district, state) | Free |
| **OpenStreetMap Nominatim** | ✅ Active | Coordinates (fallback) | Free |
| **Google Maps API** | ⚠️ Optional | Most accurate (if configured) | Paid |
| **geocode.xyz** | ✅ Fallback | Last resort coordinates | Free |

### Most Used API:
**api.postalpincode.in** is the **primary API** currently being used for:
- Getting city, district, state information
- Official Indian postal data
- Complete location hierarchy

### For Best Results:
1. **Set up Google Maps API key** for most accurate data
2. **api.postalpincode.in** works great as free alternative
3. System automatically falls back if one API fails

## Code References

- **Location Service**: `python_api/app/services/location_service.py`
- **Google Maps Service**: `python_api/app/services/google_maps_service.py`
- **API Endpoints**: `python_api/app/routes/properties.py`

## Testing

You can test the APIs directly:

```bash
# Test api.postalpincode.in
curl "https://api.postalpincode.in/pincode/500090"

# Test Nominatim
curl "https://nominatim.openstreetmap.org/search?postalcode=500090&countrycodes=in&format=json&limit=1"
```

