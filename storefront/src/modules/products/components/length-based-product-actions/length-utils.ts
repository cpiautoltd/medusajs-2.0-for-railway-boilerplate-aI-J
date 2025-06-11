// // Unit types
export type UnitType = "mm" | "inch"

// // Conversion constants
// export const UNIT_CONVERSIONS = {
//   inch: {
//     mm: 25.4,
//     inch: 1,
//   },
//   mm: {
//     inch: 0.0393701,
//     mm: 1,
//   },
// } as const

// // Convert length between units
// export function convertLength(
//   value: number,
//   from: UnitType,
//   to: UnitType
// ): number {
//   if (from === to) return value
//   return value * UNIT_CONVERSIONS[from][to]
// }

// Assuming Unit is imported as:
type Unit = "mm" | "inch" | "cm"

// Conversion constants updated to include "cm"
export const UNIT_CONVERSIONS = {
  inch: {
    mm: 25.4,
    inch: 1,
    cm: 2.54,
  },
  mm: {
    inch: 0.0393701,
    mm: 1,
    cm: 0.1,
  },
  cm: {
    inch: 1 / 2.54,
    mm: 10,
    cm: 1,
  },
} as const

// Convert length function updated to accept Unit
export function convertLength(
  value: number,
  from: Unit,
  to: Unit
): number {
  if (from === to) return value
  return value * UNIT_CONVERSIONS[from][to]
}

// Convert price per unit
export function convertUnitPrice(
  price: number,
  from: UnitType
): { converted: number; unit: UnitType } {
  if (from === "mm") {
    // Convert mm to inch: multiply by 25.4
    return {
      converted: parseFloat((price * 25.4).toFixed(4)),
      unit: "inch",
    }
  } else if (from === "inch") {
    // Convert inch to mm: divide by 25.4
    return {
      converted: parseFloat((price / 25.4).toFixed(4)),
      unit: "mm",
    }
  } else {
    throw new Error("Invalid unit. Use 'mm' or 'inch'.")
  }
}

// Format length value based on unit
export function formatLength(value: number, unit: UnitType): string {
  if (unit === "inch") {
    return value.toFixed(2)
  }
  return value.toFixed(0)
}

// Get increment amounts for a given unit
export function getIncrements(unit: UnitType) {
  return {
    major: unit === "inch" ? 1 : 25,
    minor: unit === "inch" ? 0.1 : 1,
  }
}

// Validate length against min/max
export function validateLength(
  value: number,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (isNaN(value)) {
    return { valid: false, error: "Please enter a valid number" }
  }
  
  if (value < min) {
    return { valid: false, error: `Minimum length is ${min}` }
  }
  
  if (value > max) {
    return { valid: false, error: `Maximum length is ${max}` }
  }
  
  return { valid: true }
}

// Clamp value between min and max
export function clampLength(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// Parse variant options to key-value map
export function optionsAsKeymap(variantOptions: any) {
  return variantOptions?.reduce(
    (acc: Record<string, string | undefined>, varopt: any) => {
      if (
        varopt.option &&
        varopt.value !== null &&
        varopt.value !== undefined
      ) {
        acc[varopt.option.title] = varopt.value
      }
      return acc
    },
    {}
  )
}