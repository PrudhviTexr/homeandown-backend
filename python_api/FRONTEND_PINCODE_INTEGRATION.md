# Frontend Pincode Integration Guide

## 🎯 Pincode-First Form Design

### Form Field Order (Priority)
1. **ZIP Code** (Primary field - drives everything)
2. **Address** (Auto-populated, editable)
3. **City/Area** (Auto-populated, editable)
4. **Mandal** (Auto-populated, editable)
5. **District** (Auto-populated, editable)
6. **State** (Auto-populated, editable)
7. **Country** (Auto-populated, editable)
8. **Latitude** (Auto-populated, editable)
9. **Longitude** (Auto-populated, editable)

## 🔄 Frontend Implementation Flow

### 1. Pincode Input Handler
```javascript
// When user enters pincode
const handlePincodeChange = async (pincode) => {
  if (pincode.length === 6) { // Indian pincode validation
    try {
      // Call API to get suggestions
      const response = await fetch(`/api/properties/pincode/${pincode}/suggestions`);
      const data = await response.json();
      
      if (data.suggestions) {
        // Auto-populate all fields with suggestions
        setFormData({
          ...formData,
          zip_code: pincode,
          address: data.suggestions.address || '',
          city: data.suggestions.city || '',
          mandal: data.suggestions.mandal || '',
          district: data.suggestions.district || '',
          state: data.suggestions.state || '',
          country: data.suggestions.country || 'India',
          latitude: data.suggestions.latitude || '',
          longitude: data.suggestions.longitude || ''
        });
        
        // Update map with coordinates
        if (data.map_data.coordinates) {
          updateMap(data.map_data.coordinates, data.map_data.map_bounds);
        }
        
        // Show success message
        showMessage("Location details auto-populated. You can edit any field if needed.", "success");
      }
    } catch (error) {
      showMessage("Unable to fetch location details for this pincode", "error");
    }
  }
};
```

### 2. Form Field Styling
```css
/* Pincode field - Primary styling */
.pincode-field {
  border: 2px solid #4CAF50;
  background-color: #f8fff8;
  font-weight: bold;
  font-size: 16px;
}

/* Auto-populated fields - Secondary styling */
.auto-populated-field {
  background-color: #f0f8ff;
  border-left: 4px solid #2196F3;
  position: relative;
}

.auto-populated-field::after {
  content: "✓ Auto-filled";
  position: absolute;
  top: -8px;
  right: 8px;
  background: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

/* Editable fields */
.editable-field {
  background-color: white;
  border: 1px solid #ddd;
}
```

### 3. Form Layout Structure
```jsx
<form className="location-form">
  {/* Primary Field - Pincode */}
  <div className="form-group primary-field">
    <label htmlFor="zip_code">ZIP Code *</label>
    <input
      type="text"
      id="zip_code"
      name="zip_code"
      maxLength="6"
      placeholder="Enter 6-digit pincode"
      className="pincode-field"
      onChange={(e) => handlePincodeChange(e.target.value)}
      required
    />
    <small className="help-text">
      Enter pincode to auto-fill all location details
    </small>
  </div>

  {/* Auto-populated Fields */}
  <div className="form-group">
    <label htmlFor="address">Address *</label>
    <textarea
      id="address"
      name="address"
      className="auto-populated-field"
      placeholder="Address will be auto-filled from pincode"
      value={formData.address}
      onChange={(e) => setFormData({...formData, address: e.target.value})}
      rows="3"
    />
  </div>

  <div className="form-row">
    <div className="form-group">
      <label htmlFor="city">City/Area *</label>
      <input
        type="text"
        id="city"
        name="city"
        className="auto-populated-field"
        value={formData.city}
        onChange={(e) => setFormData({...formData, city: e.target.value})}
      />
    </div>

    <div className="form-group">
      <label htmlFor="mandal">Mandal *</label>
      <input
        type="text"
        id="mandal"
        name="mandal"
        className="auto-populated-field"
        value={formData.mandal}
        onChange={(e) => setFormData({...formData, mandal: e.target.value})}
      />
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label htmlFor="district">District *</label>
      <input
        type="text"
        id="district"
        name="district"
        className="auto-populated-field"
        value={formData.district}
        onChange={(e) => setFormData({...formData, district: e.target.value})}
      />
    </div>

    <div className="form-group">
      <label htmlFor="state">State *</label>
      <input
        type="text"
        id="state"
        name="state"
        className="auto-populated-field"
        value={formData.state}
        onChange={(e) => setFormData({...formData, state: e.target.value})}
      />
    </div>
  </div>

  {/* Coordinates */}
  <div className="form-row">
    <div className="form-group">
      <label htmlFor="latitude">Latitude</label>
      <input
        type="number"
        id="latitude"
        name="latitude"
        step="0.000001"
        className="auto-populated-field"
        value={formData.latitude}
        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
      />
    </div>

    <div className="form-group">
      <label htmlFor="longitude">Longitude</label>
      <input
        type="number"
        id="longitude"
        name="longitude"
        step="0.000001"
        className="auto-populated-field"
        value={formData.longitude}
        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
      />
    </div>
  </div>

  {/* Map Display */}
  <div className="map-container">
    <div id="map" style={{height: '300px', width: '100%'}}></div>
  </div>
</form>
```

### 4. Map Integration
```javascript
// Map initialization and update
const updateMap = (coordinates, bounds) => {
  if (map) {
    // Center map on coordinates
    map.setView(coordinates, 13);
    
    // Add marker
    L.marker(coordinates).addTo(map)
      .bindPopup(`Pincode: ${formData.zip_code}`)
      .openPopup();
    
    // Highlight pincode area
    if (bounds) {
      const rectangle = L.rectangle([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ], {
        color: "#ff7800",
        weight: 2,
        fillOpacity: 0.1
      }).addTo(map);
    }
  }
};
```

### 5. Validation Rules
```javascript
const validateForm = () => {
  const errors = {};
  
  // Pincode validation
  if (!formData.zip_code || formData.zip_code.length !== 6) {
    errors.zip_code = "Please enter a valid 6-digit pincode";
  }
  
  // Required fields validation
  const requiredFields = ['address', 'city', 'mandal', 'district', 'state'];
  requiredFields.forEach(field => {
    if (!formData[field]) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });
  
  return errors;
};
```

### 6. User Experience Enhancements
```javascript
// Loading state during pincode lookup
const [isLoadingLocation, setIsLoadingLocation] = useState(false);

const handlePincodeChange = async (pincode) => {
  if (pincode.length === 6) {
    setIsLoadingLocation(true);
    try {
      // API call...
      setIsLoadingLocation(false);
    } catch (error) {
      setIsLoadingLocation(false);
      // Handle error...
    }
  }
};

// Show loading indicator
{isLoadingLocation && (
  <div className="loading-indicator">
    <span>🔍 Looking up location details...</span>
  </div>
)}
```

## 🎨 Visual Design Guidelines

### Color Scheme
- **Primary (Pincode)**: Green (#4CAF50)
- **Auto-populated**: Blue (#2196F3)
- **Editable**: Default form styling
- **Success**: Green (#4CAF50)
- **Error**: Red (#f44336)

### Icons
- **Pincode**: 📍 (Map pin)
- **Auto-filled**: ✓ (Checkmark)
- **Loading**: 🔍 (Magnifying glass)
- **Edit**: ✏️ (Pencil)

### Typography
- **Pincode field**: Bold, larger font
- **Auto-populated**: Normal weight with subtle background
- **Labels**: Clear, descriptive

## 📱 Mobile Responsiveness
- Pincode field takes full width on mobile
- Form fields stack vertically
- Map adjusts to screen size
- Touch-friendly input fields

## 🔧 API Integration Points

### Endpoints to Use
1. `GET /api/properties/pincode/{pincode}/suggestions` - For form auto-population
2. `GET /api/properties/pincode/{pincode}` - For complete location data
3. `POST /api/properties` - For property creation with populated data

### Error Handling
- Invalid pincode format
- Network errors
- API rate limiting
- Fallback to manual entry

This implementation ensures pincode is the primary field that drives the entire location form, with all other fields auto-populated but remaining editable for user flexibility.
