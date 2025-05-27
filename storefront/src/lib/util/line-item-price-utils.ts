// src/lib/util/line-item-price-utils.ts
import { HttpTypes } from "@medusajs/types"
import { extractLengthDetails } from "./length-based-utils"

/**
 * Get the unit price for a line item, accounting for length-based products
 */
export const getLineItemUnitPrice = (
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): number => {
  // Check if this is a length-based product
  const lengthDetails = extractLengthDetails(item.metadata)
  
  if (lengthDetails) {
    // For length-based products, unit price is calculated from metadata
    const { length } = lengthDetails
    if (length) {
      // The unit price is the length price plus the cutting fee
      return item.unit_price
    } 
  }
  
  // For standard products, use the variant's calculated price
  return item.variant?.calculated_price?.calculated_amount || 0
}

/**
 * Get the total price for a line item, accounting for length-based products
 */
export const getLineItemTotalPrice = (
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): number => {
  const unitPrice = getLineItemUnitPrice(item)
  return unitPrice * item.quantity
}

/**
 * Format additional details for length-based products
 */
export const formatLengthBasedDetails = (
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
): string | null => {
  const lengthDetails = extractLengthDetails(item.metadata)
  
  if (!lengthDetails) {
    return null
  }
  
  const { length, unitType } = lengthDetails
  const formattedUnitType = unitType || "inch"
  
  return `${length} ${formattedUnitType} @ ${formattedUnitType}`
}