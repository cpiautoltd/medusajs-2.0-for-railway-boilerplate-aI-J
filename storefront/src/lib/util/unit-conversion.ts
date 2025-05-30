// src/lib/util/unit-conversion.ts
import { Unit, UnitType, UNIT_CONVERSIONS } from "types/global"

/**
 * Convert a length value from one unit to another
 * @param value The length value to convert
 * @param from The unit to convert from
 * @param to The unit to convert to
 * @returns The converted value
 */
export function convertUnit(value: number, from: Unit, to: Unit): number {
  if (from === to) return value
  
  const conversionFactor = UNIT_CONVERSIONS[from][to]
  if (!conversionFactor) {
    throw new Error(`Cannot convert from ${from} to ${to}`)
  }
  
  return value * conversionFactor
}

/**
 * Convert a base unit (inch, cm, mm) to a display unit (inch or mm only)
 * If the base unit is cm, it will be converted to mm for display
 * @param value The length value to convert
 * @param baseUnit The base unit from the product
 * @param displayUnit The unit to display (inch or mm only)
 * @returns The converted value
 */
export function convertToDisplayUnit(
  value: number, 
  baseUnit: string, 
  displayUnit: UnitType
): number {
  // Handle cm -> mm conversion first
  let fromUnit: Unit = baseUnit as Unit
  let adjustedValue = value
  
  if (baseUnit === "cm") {
    fromUnit = "mm"
    adjustedValue = convertUnit(value, "cm", "mm")
  }
  
  // Now convert to the display unit if needed
  if (fromUnit === displayUnit) {
    return adjustedValue
  }
  
  return convertUnit(adjustedValue, fromUnit as Unit, displayUnit as Unit)
}

/**
 * Convert from a display unit back to the base unit
 * @param value The display value to convert
 * @param displayUnit The display unit (inch or mm)
 * @param baseUnit The base unit to convert to
 * @returns The converted value
 */
export function convertFromDisplayUnit(
  value: number,
  displayUnit: UnitType,
  baseUnit: string
): number {
  // If base unit is cm, we need to convert from display unit to mm first, then to cm
  if (baseUnit === "cm") {
    const mmValue = displayUnit === "mm" ? value : convertUnit(value, "inch", "mm")
    return convertUnit(mmValue, "mm", "cm")
  }
  
  // Otherwise, direct conversion
  if (displayUnit === baseUnit) {
    return value
  }
  
  return convertUnit(value, displayUnit as Unit, baseUnit as Unit)
}

/**
 * Format a length value for display with appropriate decimal places
 * @param value The length value
 * @param unit The unit type
 * @param decimals Optional number of decimal places (defaults based on unit)
 * @returns Formatted string
 */
export function formatLength(
  value: number, 
  unit: UnitType | string, 
  decimals?: number
): string {
  const decimalPlaces = decimals ?? (unit === "inch" ? 2 : 0)
  return value.toFixed(decimalPlaces)
}

/**
 * Get the appropriate increment amount for a given unit
 * @param unit The unit type
 * @param fine Whether to use fine increments
 * @returns The increment amount
 */
export function getIncrementAmount(unit: UnitType, fine: boolean = false): number {
  if (unit === "inch") {
    return fine ? 0.1 : 1
  } else {
    return fine ? 1 : 25
  }
}

/**
 * Determine the display unit type from a base unit
 * Converts cm to mm for display purposes
 * @param baseUnit The base unit from the product
 * @returns The display unit type
 */
export function getDisplayUnit(baseUnit: string): UnitType {
  if (baseUnit === "cm") return "mm"
  if (baseUnit === "mm") return "mm"
  return "inch"
}