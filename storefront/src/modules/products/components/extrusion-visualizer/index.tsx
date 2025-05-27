import React from 'react';
import { useEffect, useState } from 'react';

type ExtrusionVisualizerProps = {
  length: number;
  unitType: string;
  leftTap: {
    partNo: string | null;
    service_type?: string;
    tap_size?: string;
  } | null;
  rightTap: {
    partNo: string | null;
    service_type?: string;
    tap_size?: string;
  } | null;
  productImage?: string; // URL for the product image (cross-section)
  color?: string; // Color of the extrusion
}

const ExtrusionVisualizer = ({
  length,
  unitType,
  leftTap,
  rightTap,
  productImage,
  color = '#A9A9A9' // Default to a metallic gray if no color provided
}: ExtrusionVisualizerProps) => {
  // Calculate the relative length for display purposes (max 100% width)
  const [relativeLength, setRelativeLength] = useState<number>(80);
  
  // Effect to calculate relative length based on min/max possible values
  useEffect(() => {
    // This is a simplified calculation - you may want to adjust based on your product
    // This gives a length between 50-90% of the container width
    const calculatedLength = 50 + (Math.min(length, 100) / 100) * 40;
    setRelativeLength(Math.min(calculatedLength, 90));
  }, [length]);

  return (
    <div className="w-full py-2">
      {/* Visualization container */}
      <div className="relative flex items-center justify-center h-24 mb-4">
        <div className="flex items-center justify-center w-full">
          {/* Left End Tap */}
          {leftTap && leftTap.partNo && (
            <div className="relative flex flex-col items-center">
              <div className="bg-blue-500 h-12 w-6 rounded-l-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">L</span>
              </div>
            </div>
          )}

          {/* Extrusion Body */}
          <div 
            className="h-12 rounded-md flex items-center justify-center relative"
            style={{ 
              width: `${relativeLength}%`,
              backgroundColor: color,
              marginLeft: leftTap && leftTap.partNo ? '0' : '0',
              marginRight: rightTap && rightTap.partNo ? '0' : '0',
            }}
          >
            {/* Length indicator */}
            <div className="text-center">
              <span className="text-sm font-medium text-white">{length} {unitType}</span>
            </div>
          </div>

          {/* Right End Tap */}
          {rightTap && rightTap.partNo && (
            <div className="relative flex flex-col items-center">
              <div className="bg-green-500 h-12 w-6 rounded-r-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Labels for end taps */}
      <div className="flex justify-between px-2 mt-1">
        {leftTap && leftTap.partNo ? (
          <div className="text-xs text-left max-w-24 overflow-hidden">
            {leftTap.tap_size}<br/>
            <span className="text-gray-500 truncate">{leftTap.service_type?.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        ) : (
          <div className="w-12"></div> // Empty spacer
        )}
        
        <div className="flex-1"></div>
        
        {rightTap && rightTap.partNo ? (
          <div className="text-xs text-right max-w-24 overflow-hidden">
            {rightTap.tap_size}<br/>
            <span className="text-gray-500 truncate">{rightTap.service_type?.split(' ').slice(0, 2).join(' ')}</span>
          </div>
        ) : (
          <div className="w-12"></div> // Empty spacer
        )}
      </div>
    </div>
  );
};

export default ExtrusionVisualizer;