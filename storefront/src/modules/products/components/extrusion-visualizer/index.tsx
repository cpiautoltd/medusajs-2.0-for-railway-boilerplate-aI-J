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
  productImage?: string;
  color?: string;
}

const ExtrusionVisualizer = ({
  length,
  unitType,
  leftTap,
  rightTap,
  productImage,
  color = '#A9A9A9'
}: ExtrusionVisualizerProps) => {
  const [relativeLength, setRelativeLength] = useState<number>(80);
  
  useEffect(() => {
    // Calculate relative length for display (between 40-90% of container width)
    const maxDisplayLength = unitType === "inch" ? 48 : 1200; // Max display lengths
    const normalizedLength = Math.min(length / maxDisplayLength, 1);
    const calculatedLength = 40 + (normalizedLength * 50);
    setRelativeLength(Math.min(calculatedLength, 90));
  }, [length, unitType]);

  return (
    <div className="w-full py-4">
      {/* Main visualization */}
      <div className="relative bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-8">
        {/* Grid background for depth */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000 0, #000 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #000 0, #000 1px, transparent 1px, transparent 20px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Extrusion container */}
        <div className="relative flex items-center justify-center h-32">
          <div className="flex items-center">
            {/* Left End Tap */}
            {leftTap && leftTap.partNo && (
              <div className="relative">
                <div className="relative">
                  {/* Tap body */}
                  <div className="h-16 w-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-l-lg shadow-lg flex items-center justify-center overflow-hidden">
                    {/* Threading pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="h-full w-full" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                      }} />
                    </div>
                    <span className="text-white text-xs font-bold z-10">L</span>
                  </div>
                  {/* Connection point */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-1 bg-blue-700" />
                </div>
              </div>
            )}

            {/* Main Extrusion Body */}
            <div 
              className="relative h-16 shadow-lg rounded-sm overflow-hidden"
              style={{ 
                width: `${relativeLength}%`,
                minWidth: '200px',
                maxWidth: '600px',
                backgroundColor: color,
              }}
            >
              {/* Gradient overlay for metallic effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/20" />
              
              {/* Cross-section pattern if no product image */}
              {!productImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-1 opacity-10">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-black rounded-sm" />
                    ))}
                  </div>
                </div>
              )}

              {/* Product image as texture */}
              {productImage && (
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `url(${productImage})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'repeat-x',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Length label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 text-white px-3 py-1 rounded-md">
                  <span className="text-sm font-medium">
                    {length.toFixed(unitType === "inch" ? 2 : 0)} {unitType}
                  </span>
                </div>
              </div>

              {/* Top edge highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-white/40 to-transparent" />
              
              {/* Bottom edge shadow */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Right End Tap */}
            {rightTap && rightTap.partNo && (
              <div className="relative">
                <div className="relative">
                  {/* Connection point */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 bg-green-700" />
                  {/* Tap body */}
                  <div className="h-16 w-8 bg-gradient-to-l from-green-600 to-green-500 rounded-r-lg shadow-lg flex items-center justify-center overflow-hidden">
                    {/* Threading pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="h-full w-full" style={{
                        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                      }} />
                    </div>
                    <span className="text-white text-xs font-bold z-10">R</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dimension lines */}
        <div className="relative mt-6">
          <div className="flex items-center justify-center">
            <div className="relative" style={{ width: `${relativeLength}%`, maxWidth: '600px' }}>
              {/* Dimension line */}
              <div className="absolute top-2 left-0 right-0 h-px bg-gray-400" />
              {/* Left endpoint */}
              <div className="absolute top-0 left-0 w-px h-4 bg-gray-400" />
              {/* Right endpoint */}
              <div className="absolute top-0 right-0 w-px h-4 bg-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tap details */}
      {(leftTap?.partNo || rightTap?.partNo) && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {leftTap?.partNo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium text-blue-900">Left End Tap</span>
              </div>
              <div className="text-xs text-blue-700 space-y-0.5">
                <div>Size: {leftTap.tap_size}</div>
                <div>{leftTap.service_type?.replace(' End Tap', '')}</div>
              </div>
            </div>
          )}
          
          {rightTap?.partNo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-900">Right End Tap</span>
              </div>
              <div className="text-xs text-green-700 space-y-0.5">
                <div>Size: {rightTap.tap_size}</div>
                <div>{rightTap.service_type?.replace(' End Tap', '')}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExtrusionVisualizer;