// src/modules/products/components/length-slider/index.tsx
import React, { useState } from "react"
import { clx } from "@medusajs/ui"

type LengthSliderProps = {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const LengthSlider: React.FC<LengthSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
  disabled = false
}) => {
  const percentage = ((value - min) / (max - min)) * 100

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value))
  }

  return (
    <div className="relative w-full h-6 flex items-center">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={clx(
          "w-full h-2 appearance-none bg-ui-bg-field rounded-full outline-none cursor-pointer",
          "range-input",
          { "opacity-50 cursor-not-allowed": disabled }
        )}
      />
      <style jsx global>{`
        .range-input::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg-interactive);
          cursor: pointer;
        }
        .range-input::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg-interactive);
          cursor: pointer;
        }
      `}</style>
      <div 
        className="absolute pointer-events-none h-2 bg-ui-bg-interactive rounded-full" 
        style={{ width: `${percentage}%`, left: 0 }}
      />
    </div>
  )
}

export default LengthSlider