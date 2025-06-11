import React from "react"
import { clx } from "@medusajs/ui"

export type TapOption = {
  tap_size: string
  price: number
  min_depth: number
  service_type: string
  part_no: string
  currency: string
}

interface EndTapOptionsProps {
  options: TapOption[]
  leftValue: string | null
  rightValue: string | null
  onLeftChange: (value: string | null) => void
  onRightChange: (value: string | null) => void
  disabled?: boolean
  loading?: boolean
  currency?: string
}

const EndTapOptions: React.FC<EndTapOptionsProps> = ({
  options,
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  disabled = false,
  loading = false,
  currency = "$",
}) => {
  const formatPrice = (price: number) => {
    return `${currency}${price.toFixed(2)}`
  }

  const TapSelect = ({
    label,
    value,
    onChange,
    position,
  }: {
    label: string
    value: string | null
    onChange: (value: string | null) => void
    position: "left" | "right"
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {value && (
          <span className="text-xs text-gray-500">
            {options.find(opt => opt.tap_size === value)?.part_no}
          </span>
        )}
      </div>
      
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled || loading}
          className={clx(
            "w-full px-3 py-2.5 pr-10",
            "border rounded-lg text-sm",
            "appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            "transition-all duration-200",
            disabled || loading 
              ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-60"
              : "bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-gray-900",
            value && !disabled && !loading && "border-gray-400 font-medium"
          )}
        >
          <option value="" className="text-gray-500">No tap</option>
          {options.map((option, idx) => (
            <option key={idx} value={option.part_no} className="text-gray-900">
              {option.tap_size} - {option.service_type} (+{formatPrice(option.price)})
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      
      {value && (
        <div className="text-xs text-gray-600 space-y-1">
          {(() => {
            const selected = options.find(opt => opt.tap_size === value)
            if (!selected) return null
            
            return (
              <>
                <div className="flex justify-between">
                  <span>Min Depth:</span>
                  <span className="font-medium">{selected.min_depth}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{selected.service_type}</span>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )

  // Calculate total tap cost
  const totalTapCost = React.useMemo(() => {
    let cost = 0
    
    if (leftValue) {
      const leftOption = options.find(opt => opt.tap_size === leftValue)
      if (leftOption) cost += leftOption.price
    }
    
    if (rightValue) {
      const rightOption = options.find(opt => opt.tap_size === rightValue)
      if (rightOption) cost += rightOption.price
    }
    
    return cost
  }, [leftValue, rightValue, options])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          End Tap Options
        </h3>
        {totalTapCost > 0 && (
          <span className="text-sm font-medium text-gray-600">
            +{formatPrice(totalTapCost)}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TapSelect
          label="Left End"
          value={leftValue}
          onChange={onLeftChange}
          position="left"
        />
        
        <TapSelect
          label="Right End"
          value={rightValue}
          onChange={onRightChange}
          position="right"
        />
      </div>
      
      {/* Visual representation of selected taps */}
      {(leftValue || rightValue) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <div className={clx(
              "flex items-center gap-2",
              !leftValue && "text-gray-400"
            )}>
              <div className={clx(
                "w-2 h-2 rounded-full",
                leftValue ? "bg-green-500" : "bg-gray-300"
              )} />
              <span>{leftValue || "No tap"}</span>
            </div>
            
            <div className="flex-1 mx-4 h-px bg-gray-300" />
            
            <div className={clx(
              "flex items-center gap-2",
              !rightValue && "text-gray-400"
            )}>
              <span>{rightValue || "No tap"}</span>
              <div className={clx(
                "w-2 h-2 rounded-full",
                rightValue ? "bg-green-500" : "bg-gray-300"
              )} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EndTapOptions