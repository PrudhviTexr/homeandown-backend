# Map Picker Guide - Pinpoint Exact Property Location

## ✅ Map Picker Feature is Now Available!

You can now **click on a map** to set the exact property location, even if you're in a different location!

## How It Works

### 🎯 **Map Picker Component**

The new `MapPicker` component allows you to:

1. **Click on Map** → Set exact coordinates
2. **Search by Pincode** → Jump to location
3. **Manual Coordinates** → Enter lat/lng directly
4. **Reverse Geocode** → Get address from coordinates
5. **Visual Marker** → See exact location on map

### 📍 **Features**

✅ **Click to Set Location**: Click anywhere on the map to set coordinates  
✅ **Pincode Search**: Search by pincode to jump to location  
✅ **Manual Entry**: Enter coordinates directly  
✅ **Auto Address**: Automatically gets address from coordinates  
✅ **Visual Feedback**: Marker shows exact location  
✅ **Works Anywhere**: You can be in one place and set property in another  

## How to Use

### Step 1: Enter Pincode (Optional)
1. Enter pincode in the location form
2. System auto-populates city, district, state
3. Map centers on pincode location

### Step 2: Pinpoint Exact Location
1. **Click on the map** where your property is located
2. A marker appears at the clicked location
3. Coordinates are automatically saved
4. Address is automatically fetched (if available)

### Step 3: Fine-Tune (Optional)
1. You can manually adjust latitude/longitude
2. Map updates automatically
3. Marker moves to new position

## Integration

### In Property Form

The MapPicker is now integrated into `UnifiedPropertyForm`:

```tsx
<MapPicker
  latitude={formData.latitude}
  longitude={formData.longitude}
  onLocationChange={(lat, lng) => {
    // Updates form coordinates
  }}
  onAddressUpdate={(address) => {
    // Updates form address
  }}
  height="500px"
  showReverseGeocode={true}
/>
```

### Location in Form

The MapPicker appears **after the LocationSelector**:
1. First: Enter pincode → Auto-populate location fields
2. Then: Click on map → Set exact coordinates

## Technical Details

### Map Library
- **Leaflet** (Free, Open Source)
- **OpenStreetMap Tiles** (Free)
- No API keys needed!

### Backend Integration
- **Reverse Geocoding**: Uses OpenStreetMap Nominatim
- **Endpoint**: `POST /api/properties/geocode/reverse`
- **Free**: No costs

### Data Flow

```
User clicks on map
    ↓
Coordinates captured (lat, lng)
    ↓
Form updated with coordinates
    ↓
Reverse geocode (optional)
    ↓
Address fetched and displayed
    ↓
Coordinates stored in database
```

## Example Usage

### Scenario: Adding Property in Different Location

**You are in**: Mumbai  
**Property is in**: Hyderabad

**Steps:**
1. Enter pincode: `500090` (Hyderabad)
2. System auto-fills: City, District, State
3. Map shows Hyderabad area
4. **Click on exact property location** on map
5. Coordinates saved: `17.3850, 78.4867`
6. Address auto-filled from coordinates
7. Done! ✅

### What Gets Stored

- ✅ **Latitude**: Exact coordinate
- ✅ **Longitude**: Exact coordinate  
- ✅ **Address**: From reverse geocoding
- ✅ **All location fields**: From pincode

## Features Breakdown

### 1. Click to Set Location
- Click anywhere on map
- Marker appears instantly
- Coordinates saved automatically

### 2. Pincode Search
- Enter 6-digit pincode
- Map centers on location
- Marker placed automatically

### 3. Manual Coordinates
- Enter latitude/longitude directly
- Map updates automatically
- Marker moves to position

### 4. Reverse Geocoding
- Automatically fetches address
- Uses OpenStreetMap (free)
- Updates address field

### 5. Visual Feedback
- Custom marker icon
- Shows exact location
- Easy to see property position

## Benefits

✅ **Accurate**: Pinpoint exact location  
✅ **Flexible**: Works from anywhere  
✅ **Free**: Uses OpenStreetMap (no costs)  
✅ **Easy**: Just click on map  
✅ **Automatic**: Address fetched automatically  
✅ **Visual**: See location on map  

## Map Controls

- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Click**: Set marker location
- **Search**: Enter pincode to jump

## Troubleshooting

### Map Not Loading
- Check internet connection
- OpenStreetMap tiles require internet
- Try refreshing the page

### Coordinates Not Saving
- Check browser console for errors
- Ensure form is not in read-only mode
- Verify coordinates are valid numbers

### Address Not Showing
- Reverse geocoding may fail for some locations
- You can manually enter address
- Coordinates are still saved correctly

## Summary

🎉 **You can now pinpoint exact property locations!**

- ✅ Click on map to set location
- ✅ Works from anywhere in the world
- ✅ Coordinates stored accurately
- ✅ Address auto-filled
- ✅ 100% Free (OpenStreetMap)

**The MapPicker is integrated and ready to use!** 🗺️

