import React, { useRef, useState, useEffect, useCallback } from "react"
import { ChevronUpDown, Plus, Minus } from "@medusajs/icons"
import { clx } from "@medusajs/ui"

type UnitType = "mm" | "inch"

interface EnhancedLengthInputProps {
  value: number
  min: number
  max: number
  unit: UnitType
  disabled?: boolean
  loading?: boolean
  onChange: (value: number) => void
  onUnitChange: (unit: UnitType) => void
  pricePerUnit?: number
  currency?: string
}

const EnhancedLengthInput: React.FC<EnhancedLengthInputProps> = ({
  value,
  min,
  max,
  unit,
  disabled = false,
  loading = false,
  onChange,
  onUnitChange,
  pricePerUnit,
  currency = "$",
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value.toString())
  const [error, setError] = useState<string | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Update input value when prop changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toFixed(unit === "inch" ? 2 : 0))
    }
  }, [value, unit, isFocused])

  // Get increment amounts based on unit
  const getMajorIncrement = () => (unit === "inch" ? 1 : 25)
  const getMinorIncrement = () => (unit === "inch" ? 0.1 : 1)

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Allow empty input while typing
    if (newValue === "") return
    
    const parsed = parseFloat(newValue)
    if (isNaN(parsed)) {
      setError("Please enter a valid number")
      return
    }
    
    validateAndUpdate(parsed)
  }

  // Validate and update value
  const validateAndUpdate = (newValue: number) => {
    if (newValue < min) {
      setError(`Minimum length is ${min} ${unit}`)
      return
    }
    
    if (newValue > max) {
      setError(`Maximum length is ${max} ${unit}`)
      return
    }
    
    setError(null)
    onChange(newValue)
  }

  // Handle blur to format and validate
  const handleBlur = () => {
    setIsFocused(false)
    const parsed = parseFloat(inputValue)
    
    if (isNaN(parsed) || inputValue === "") {
      setInputValue(value.toFixed(unit === "inch" ? 2 : 0))
      setError(null)
      return
    }
    
    // Clamp to min/max
    const clamped = Math.max(min, Math.min(max, parsed))
    if (clamped !== parsed) {
      onChange(clamped)
      setInputValue(clamped.toFixed(unit === "inch" ? 2 : 0))
    } else {
      setInputValue(parsed.toFixed(unit === "inch" ? 2 : 0))
    }
    setError(null)
  }

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) return
    
    let increment = 0
    
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault()
        increment = e.shiftKey ? getMinorIncrement() : getMajorIncrement()
        break
      case "ArrowDown":
        e.preventDefault()
        increment = e.shiftKey ? -getMinorIncrement() : -getMajorIncrement()
        break
      default:
        return
    }
    
    const currentValue = parseFloat(inputValue) || value
    const newValue = Math.max(min, Math.min(max, currentValue + increment))
    
    onChange(newValue)
    setInputValue(newValue.toFixed(unit === "inch" ? 2 : 0))
    setError(null)
  }, [disabled, loading, inputValue, value, min, max, unit, onChange])

  // Handle increment/decrement buttons
  const handleIncrement = (major: boolean) => {
    if (disabled || loading) return
    
    const increment = major ? getMajorIncrement() : getMinorIncrement()
    const newValue = Math.min(max, value + increment)
    onChange(newValue)
    setError(null)
  }

  const handleDecrement = (major: boolean) => {
    if (disabled || loading) return
    
    const decrement = major ? getMajorIncrement() : getMinorIncrement()
    const newValue = Math.max(min, value - decrement)
    onChange(newValue)
    setError(null)
  }

  return (
    <div className="space-y-3">
      {/* Unit Toggle */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Length
        </label>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button
            type="button"
            onClick={() => onUnitChange("inch")}
            disabled={disabled || loading}
            className={clx(
              "px-3 py-1.5 text-xs font-medium transition-all",
              unit === "inch"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
              (disabled || loading) && "opacity-50 cursor-not-allowed"
            )}
          >
            Inch
          </button>
          <button
            type="button"
            onClick={() => onUnitChange("mm")}
            disabled={disabled || loading}
            className={clx(
              "px-3 py-1.5 text-xs font-medium transition-all",
              unit === "mm"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
              (disabled || loading) && "opacity-50 cursor-not-allowed"
            )}
          >
            mm
          </button>
        </div>
      </div>

      {/* Input with controls */}
      <div className="relative">
        <div className="flex items-center gap-1">
          {/* Decrement buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => handleDecrement(true)}
              disabled={disabled || loading || value <= min}
              className={clx(
                "p-1 rounded-md transition-all",
                "hover:bg-gray-100 active:bg-gray-200",
                (disabled || loading || value <= min) && "opacity-30 cursor-not-allowed"
              )}
              title={`Decrease by ${getMajorIncrement()} ${unit}`}
            >
              <Minus className="h-3 w-3" />
            </button>
            {/* <button
              type="button"
              onClick={() => handleDecrement(false)}
              disabled={disabled || loading || value <= min}
              className={clx(
                "p-1 rounded-md transition-all",
                "hover:bg-gray-100 active:bg-gray-200",
                (disabled || loading || value <= min) && "opacity-30 cursor-not-allowed"
              )}
              title={`Decrease by ${getMinorIncrement()} ${unit}`}
            >
              <Minus className="h-2.5 w-2.5" />
            </button> */}
          </div>

          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.target.select()
                setIsFocused(true)
              }}
              onBlur={handleBlur}
              disabled={disabled || loading}
              min={min}
              max={max}
              step={unit === "inch" ? 0.01 : 1}
              className={clx(
                "w-full px-4 py-3 text-center text-lg font-semibold rounded-lg",
                "border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-gray-900 focus:ring-gray-900",
                (disabled || loading) && "bg-gray-50 cursor-not-allowed opacity-60",
                !disabled && !loading && "bg-white hover:border-gray-300"
              )}
              style={{
                WebkitAppearance: "none",
                MozAppearance: "textfield",
              }}
            />
            
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            )}
            
            {/* Unit label */}
            <span className={clx(
              "absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium",
              error ? "text-red-600" : "text-gray-500"
            )}>
              {unit}
            </span>
          </div>

          {/* Increment buttons */}
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => handleIncrement(true)}
              disabled={disabled || loading || value >= max}
              className={clx(
                "p-1 rounded-md transition-all",
                "hover:bg-gray-100 active:bg-gray-200",
                (disabled || loading || value >= max) && "opacity-30 cursor-not-allowed"
              )}
              title={`Increase by ${getMajorIncrement()} ${unit}`}
            >
              <Plus className="h-3 w-3" />
            </button>
            {/* <button
              type="button"
              onClick={() => handleIncrement(false)}
              disabled={disabled || loading || value >= max}
              className={clx(
                "p-1 rounded-md transition-all",
                "hover:bg-gray-100 active:bg-gray-200",
                (disabled || loading || value >= max) && "opacity-30 cursor-not-allowed"
              )}
              title={`Increase by ${getMinorIncrement()} ${unit}`}
            >
              <Plus className="h-2.5 w-2.5" />
            </button> */}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-600 animate-in fade-in duration-200">
            {error}
          </p>
        )}

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>
            Range: {min} - {max} {unit}
          </span>
          {pricePerUnit && (
            <span className="font-semibold">
              {currency} ${pricePerUnit.toFixed(2)}/{unit}
            </span>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        {/* <div className="mt-1 text-xs text-gray-400">
          <span className="hidden sm:inline">
            ↑/↓: ±{getMajorIncrement()}{unit} • Shift+↑/↓: ±{getMinorIncrement()}{unit}
          </span>
        </div> */}
      </div>
    </div>
  )
}

export default EnhancedLengthInput