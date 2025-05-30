"use client"

import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@medusajs/ui"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  return (
    <div className="space-y-3">
      <Text className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
        {title}
      </Text>
      
      <RadioGroup data-testid={dataTestId} onValueChange={handleChange}>
        <div className="border border-gray-200 rounded-md overflow-hidden">
          {items?.map((item, index) => {
            const isSelected = item.value === value
            const isFirst = index === 0
            const isLast = index === items.length - 1
            
            return (
              <div
                key={item.value}
                className={clx(
                  "relative",
                  {
                    "border-b border-gray-200": !isLast,
                  }
                )}
              >
                <RadioGroup.Item
                  checked={isSelected}
                  className="hidden peer"
                  id={item.value}
                  value={item.value}
                />
                
                <Label
                  htmlFor={item.value}
                  className={clx(
                    "flex items-center w-full px-4 py-3 text-sm cursor-pointer transition-all duration-200 select-none",
                    {
                      "bg-blue-50 text-blue-800 font-medium border-r-2 border-blue-500": isSelected,
                      "bg-white text-gray-700 hover:bg-gray-50": !isSelected,
                      "rounded-t-md": isFirst,
                      "rounded-b-md": isLast,
                    }
                  )}
                  data-testid="radio-label"
                  data-active={isSelected}
                >
                  {/* Selection indicator */}
                  <div className="flex items-center mr-3">
                    {isSelected ? (
                      <EllipseMiniSolid className="text-blue-600" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Label text */}
                  <span className="flex-1">
                    {item.label}
                  </span>
                  
                  {/* Optional count or metadata could go here */}
                  {/* 
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                    {item.count}
                  </span> 
                  */}
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>
    </div>
  )
}

export default FilterRadioGroup