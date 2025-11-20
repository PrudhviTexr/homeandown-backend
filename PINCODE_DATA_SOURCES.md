# Pincode Data Sources Guide

## Overview
This guide explains where to get actual, reliable Indian pincode data and how to import it into the system.

## Available Data Sources

### 1. **api.postalpincode.in** (Free, Recommended)
- **Type**: Free REST API
- **Coverage**: All Indian pincodes
- **Data Provided**: 
  - City/Area name
  - District
  - State
  - Region, Division, Circle, Block
  - Country
- **Rate Limits**: No official limits, but be respectful
- **Accuracy**: ⭐⭐⭐⭐ (Very Good)
- **Usage**: Already integrated in the system

**Example API Call:**
```bash
curl "https://api.postalpincode.in/pincode/500090"
```

**Response:**
```json
{
  "Message": "Number of pincode(s) found:1",
  "Status": "Success",
  "PostOffice": [{
    "Name": "Serilingampally",
    "Description": null,
    "BranchType": "S.O",
    "DeliveryStatus": "Delivery",
    "Circle": "Andhra Pradesh",
    "District": "Hyderabad",
    "Division": "Hyderabad City",
    "Region": "Hyderabad",
    "Block": "Serilingampally",
    "State": "Telangana",
    "Country": "India",
    "Pincode": "500090"
  }]
}
```

### 2. **Google Maps Geocoding API** (Paid, Most Accurate)
- **Type**: Paid API
- **Coverage**: Global (including all Indian pincodes)
- **Data Provided**:
  - Precise coordinates (latitude/longitude)
  - Formatted address
  - Address components (state, district, city)
- **Cost**: $5 per 1,000 requests (first $200 free/month)
- **Accuracy**: ⭐⭐⭐⭐⭐ (Excellent)
- **Usage**: Already integrated, requires API key

### 3. **India Post Official Data** (Official Source)
- **Type**: Government database
- **Coverage**: All official Indian pincodes
- **Availability**: 
  - May require official request
  - Some datasets available on data.gov.in
  - CSV/Excel files available from various sources
- **Accuracy**: ⭐⭐⭐⭐⭐ (Official)
- **Usage**: Can be imported via CSV

### 4. **OpenStreetMap Nominatim** (Free, Open Source)
- **Type**: Free geocoding service
- **Coverage**: Global (including India)
- **Data Provided**: Coordinates, address components
- **Rate Limits**: 1 request per second (be respectful)
- **Accuracy**: ⭐⭐⭐ (Good)
- **Usage**: Already integrated as fallback

### 5. **Kaggle Datasets** (Free Datasets)
- **Type**: Community datasets
- **Coverage**: Various Indian pincode datasets
- **Format**: CSV, JSON
- **Examples**:
  - "India Pincode Dataset"
  - "Indian Postal Codes"
- **Accuracy**: ⭐⭐⭐ (Varies by dataset)
- **Usage**: Download and import via CSV

## Import Methods

### Method 1: Using the Import Script (Recommended)

The system includes a comprehensive import script:

```bash
cd python_api
python scripts/import_pincode_data.py
```

**Options:**
1. **Import Common Pincodes**: Major cities (Hyderabad, Mumbai, Delhi, Bangalore, Chennai, Kolkata)
2. **Import from CSV**: Import from a CSV file
3. **Import by Range**: Import pincodes in a specific range
4. **Import Custom List**: Import specific pincodes

### Method 2: Manual CSV Import

**CSV Format:**
```csv
pincode,city,district,state,latitude,longitude
500090,Serilingampally,Hyderabad,Telangana,17.3850,78.4867
500001,Secunderabad,Hyderabad,Telangana,17.4399,78.4983
```

**Import Command:**
```bash
python scripts/import_pincode_data.py
# Choose option 2 and provide CSV file path
```

### Method 3: Automatic Import on First Use

The system automatically:
1. Fetches pincode data when user enters a pincode
2. Stores it in the database for future use
3. Uses cached data for subsequent requests

This means pincodes are imported **on-demand** as users use them.

## Database Schema

The pincode data is stored in the `pincodes` table:

```sql
CREATE TABLE pincodes (
  pincode VARCHAR(6) PRIMARY KEY,
  city VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(100) DEFAULT 'India',
  region VARCHAR(255),
  division VARCHAR(255),
  circle VARCHAR(255),
  block VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Recommended Approach

### For Production:

1. **Initial Setup**: Import common pincodes for major cities
   ```bash
   python scripts/import_pincode_data.py
   # Choose option 1
   ```

2. **On-Demand Import**: Let the system automatically import pincodes as users use them
   - More efficient
   - Only imports what's needed
   - Uses Google Maps for accuracy (if configured)

3. **Bulk Import** (Optional): If you have a CSV file with pincode data
   ```bash
   python scripts/import_pincode_data.py
   # Choose option 2
   ```

### For Development/Testing:

1. Use the common pincodes import
2. Test with known pincodes (500090, 400050, etc.)
3. Verify auto-population works correctly

## Data Quality

### Current System Priority:

1. **Google Maps API** (if configured)
   - Most accurate coordinates
   - Complete address components
   - Reliable data

2. **api.postalpincode.in**
   - Official Indian postal data
   - Complete location hierarchy
   - Free and reliable

3. **OpenStreetMap**
   - Good for coordinates
   - May have incomplete address components

4. **Database Cache**
   - Previously imported pincodes
   - Fast retrieval
   - No API calls needed

## Where to Get CSV Files

### Free Sources:

1. **Kaggle**: Search for "India pincode dataset"
2. **GitHub**: Various open-source pincode datasets
3. **data.gov.in**: Government open data portal
4. **Community Datasets**: Various community-maintained datasets

### Paid Sources:

1. **India Post Official Database**: Contact India Post
2. **Commercial Data Providers**: Various data vendors
3. **Google Maps Places API**: Can export data (with restrictions)

## Example CSV File

Create a file `pincodes.csv`:

```csv
pincode,city,district,state,latitude,longitude
500090,Serilingampally,Hyderabad,Telangana,17.3850,78.4867
500001,Secunderabad,Hyderabad,Telangana,17.4399,78.4983
500002,Khairatabad,Hyderabad,Telangana,17.4065,78.4772
400050,Mumbai,Mumbai,Maharashtra,19.0760,72.8777
110049,Delhi,Delhi,Delhi,28.6139,77.2090
560001,Bangalore,Bangalore Urban,Karnataka,12.9716,77.5946
600001,Chennai,Chennai,Tamil Nadu,13.0827,80.2707
```

Then import:
```bash
python scripts/import_pincode_data.py
# Choose option 2
# Enter path: pincodes.csv
```

## Best Practices

1. **Start Small**: Import common pincodes first
2. **Use On-Demand**: Let system import as needed
3. **Cache Results**: System automatically caches in database
4. **Verify Data**: Check a few pincodes manually
5. **Update Regularly**: Re-run import for new/updated pincodes

## Troubleshooting

### Pincode Not Found
- Check if pincode is valid (6 digits)
- Verify API is accessible
- Try importing manually

### Incomplete Data
- Some pincodes may not have complete data
- System will use best available data
- Users can manually edit fields

### Import Slow
- Normal for large datasets
- System includes rate limiting
- Consider importing in batches

## Summary

✅ **Best Source**: api.postalpincode.in (free, reliable)  
✅ **Most Accurate**: Google Maps API (paid, but very accurate)  
✅ **Import Method**: Use the provided script  
✅ **Storage**: Database table `pincodes`  
✅ **Auto-Import**: System imports on-demand  

The system is designed to work with minimal setup - just run the import script for common pincodes, and let the system handle the rest automatically! 🎉

