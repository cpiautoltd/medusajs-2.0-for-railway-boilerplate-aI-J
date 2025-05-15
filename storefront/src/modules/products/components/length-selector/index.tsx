// src/modules/products/components/length-selector/index.tsx
import React, { useState, useEffect } from "react"
import { Input, Text, clx } from "@medusajs/ui"
import { ExtrudedProduct } from "types/global"
import LengthSlider from "../length-slider"

type LengthSelectorProps = {
  extrudedProduct: ExtrudedProduct
  selectedLength: number
  onChange: (length: number) => void
  disabled?: boolean
}

const LengthSelector: React.FC<LengthSelectorProps> = ({
  extrudedProduct,
  selectedLength,
  onChange,
  disabled = false,
}) => {
  const { minLength, maxLength, unitType } = extrudedProduct
  const [inputValue, setInputValue] = useState<string>(selectedLength.toString())
  
  useEffect(() => {
    setInputValue(selectedLength.toString())
  }, [selectedLength])

  const handleSliderChange = (value: number) => {
    onChange(value)
    setInputValue(value.toString())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    // Validate input is between min and max
    let parsedValue = parseFloat(inputValue)
    
    if (isNaN(parsedValue)) {
      parsedValue = minLength
    } else {
      parsedValue = Math.max(minLength, Math.min(maxLength, parsedValue))
    }
    
    setInputValue(parsedValue.toString())
    onChange(parsedValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex justify-between">
        <Text className="text-ui-fg-base">Length ({unitType})</Text>
        <div className="flex items-center gap-x-2">
          <Input
            type="number"
            min={minLength}
            max={maxLength}
            step="0.1"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={clx("w-20 p-0 h-7 text-right", {
              "opacity-50": disabled
            })}
          />
          <Text className="text-ui-fg-muted">{unitType}</Text>
        </div>
      </div>
      <LengthSlider
        value={selectedLength}
        min={minLength}
        max={maxLength}
        step={0.1}
        onChange={handleSliderChange}
        disabled={disabled}
      />
      <div className="flex justify-between text-ui-fg-subtle text-small-regular">
        <span>{minLength} {unitType}</span>
        <span>{maxLength} {unitType}</span>
      </div>
    </div>
  )
}

export default LengthSelector