import React, { useState, useEffect } from 'react';

const LocationForm = () => {
  const [formData, setFormData] = useState({
    zip_code: '',
    address: '',
    city: '',
    mandal: '',
    district: '',
    state: '',
    country: 'India',
    latitude: '',
    longitude: ''
  });
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  // Handle pincode input - PRIMARY FIELD
  const handlePincodeChange = async (pincode) => {
    setFormData(prev => ({ ...prev, zip_code: pincode }));
    
    if (pincode.length === 6) {
      setIsLoadingLocation(true);
      setLocationMessage('');
      
      try {
        const response = await fetch(`/api/properties/pincode/${pincode}/suggestions`);
        const data = await response.json();
        
        if (data.suggestions) {
          // Auto-populate all fields with suggestions
          setFormData(prev => ({
            ...prev,
            address: data.suggestions.address || '',
            city: data.suggestions.city || '',
            mandal: data.suggestions.mandal || '',
            district: data.suggestions.district || '',
            state: data.suggestions.state || '',
            country: data.suggestions.country || 'India',
            latitude: data.suggestions.latitude || '',
            longitude: data.suggestions.longitude || ''
          }));
          
          setLocationMessage('✅ Location details auto-populated. You can edit any field if needed.');
          
          // Update map if coordinates available
          if (data.map_data?.coordinates) {
            updateMap(data.map_data.coordinates, data.map_data.map_bounds);
          }
        }
      } catch (error) {
        setLocationMessage('❌ Unable to fetch location details for this pincode');
        console.error('Location fetch error:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    }
  };

  // Handle individual field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Map update function
  const updateMap = (coordinates, bounds) => {
    // Implement your map library logic here
    console.log('Map should center on:', coordinates);
    console.log('Map bounds:', bounds);
  };

  return (
    <div className="location-form-container">
      <h2>📍 Location Details</h2>
      
      {/* PRIMARY FIELD - Pincode */}
      <div className="form-group primary-field">
        <label htmlFor="zip_code">ZIP Code *</label>
        <input
          type="text"
          id="zip_code"
          name="zip_code"
          maxLength="6"
          placeholder="Enter 6-digit pincode"
          className="pincode-field"
          value={formData.zip_code}
          onChange={(e) => handlePincodeChange(e.target.value)}
          required
        />
        <small className="help-text">
          Enter pincode to auto-fill all location details
        </small>
        
        {/* Loading indicator */}
        {isLoadingLocation && (
          <div className="loading-indicator">
            🔍 Looking up location details...
          </div>
        )}
        
        {/* Success/Error message */}
        {locationMessage && (
          <div className={`message ${locationMessage.includes('✅') ? 'success' : 'error'}`}>
            {locationMessage}
          </div>
        )}
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
          onChange={(e) => handleFieldChange('address', e.target.value)}
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
            onChange={(e) => handleFieldChange('city', e.target.value)}
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
            onChange={(e) => handleFieldChange('mandal', e.target.value)}
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
            onChange={(e) => handleFieldChange('district', e.target.value)}
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
            onChange={(e) => handleFieldChange('state', e.target.value)}
          />
        </div>
      </div>

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
            onChange={(e) => handleFieldChange('latitude', e.target.value)}
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
            onChange={(e) => handleFieldChange('longitude', e.target.value)}
          />
        </div>
      </div>

      {/* Map Display */}
      <div className="map-container">
        <div id="map" style={{height: '300px', width: '100%', border: '1px solid #ddd'}}>
          Map will be displayed here when pincode is entered
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button type="button" className="btn-secondary">
          Clear All
        </button>
        <button type="submit" className="btn-primary">
          Save Location
        </button>
      </div>
    </div>
  );
};

export default LocationForm;

/* CSS Styles */
const styles = `
.location-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.primary-field {
  margin-bottom: 30px;
}

.pincode-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #4CAF50;
  border-radius: 6px;
  background-color: #f8fff8;
  font-weight: bold;
  font-size: 16px;
}

.pincode-field:focus {
  outline: none;
  border-color: #45a049;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.auto-populated-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #2196F3;
  border-left: 4px solid #2196F3;
  border-radius: 4px;
  background-color: #f0f8ff;
  position: relative;
}

.auto-populated-field:focus {
  outline: none;
  border-color: #1976D2;
  background-color: white;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group {
  flex: 1;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.help-text {
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}

.loading-indicator {
  color: #2196F3;
  font-size: 14px;
  margin-top: 5px;
}

.message {
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 5px;
  font-size: 14px;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.map-container {
  margin: 20px 0;
  border-radius: 8px;
  overflow: hidden;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-secondary {
  background-color: #f44336;
  color: white;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
