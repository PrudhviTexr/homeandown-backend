import React from 'react';

interface MockMapProps {
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  scrollWheelZoom?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MapContainer: React.FC<MockMapProps> = ({ center, style, children }) => {
  return (
    <div 
      style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div className="text-gray-500 text-center">
        <div className="text-lg font-medium">Map View</div>
        <div className="text-sm">Interactive map will load here</div>
        {center && <div className="text-xs mt-2">Location: {center[0]}, {center[1]}</div>}
      </div>
      {children}
    </div>
  );
};

export const TileLayer: React.FC<{ url?: string; attribution?: string }> = () => null;
export const Marker: React.FC<{ position?: [number, number]; children?: React.ReactNode }> = ({ children }) => <>{children}</>;
export const Popup: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

export default {
  MapContainer,
  TileLayer,
  Marker,
  Popup
};