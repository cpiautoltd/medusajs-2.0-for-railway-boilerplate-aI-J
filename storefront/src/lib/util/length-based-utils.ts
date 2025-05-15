// src/lib/util/length-based-utils.ts
import { ExtendedProduct, ExtrudedProduct } from "types/global"

/**
 * Check if a product is length-based
 */
export const isLengthBasedProduct = (product: ExtendedProduct): boolean => {
  return Boolean(product.extruded_products?.is_length_based)
}

/**
 * Calculate the price for a length-based product
 * @param extrudedProduct - The extruded product metadata
 * @param selectedLength - The selected length
 * @param quantity - The quantity (default: 1)
 * @returns The calculated price
 */
export const calculateLengthBasedPrice = (
  extrudedProduct: ExtrudedProduct,
  selectedLength: number,
  quantity: number = 1
): number => {
  if (!extrudedProduct || !selectedLength) {
    return 0
  }

  // Calculate the base price based on length
  const basePrice = extrudedProduct.price_per_unit * selectedLength
  
  // Add the cutting fee
  const totalPrice = basePrice + extrudedProduct.cut_price
  
  // Multiply by quantity
  return totalPrice * quantity
}

/**
 * Format the length with appropriate unit
 */
export const formatLength = (length: number, unitType: string): string => {
  return `${length} ${unitType}`
}

/**
 * Validate if the selected length is within the allowed range
 */
export const isValidLength = (
  selectedLength: number,
  extrudedProduct: ExtrudedProduct
): boolean => {
  if (!extrudedProduct) {
    return false
  }
  
  const { minLength, maxLength } = extrudedProduct
  return selectedLength >= minLength && selectedLength <= maxLength
}

/**
 * Extract length-based product details from cart item metadata
 */
export const extractLengthDetails = (
    metadata: Record<string, any> | null | undefined
  ) => {
    if (!metadata) {
      return null;
    }
  
    // Check for the lengthPricing object structure with the properties we actually have
    if (metadata.lengthPricing) {
      return {
        length: metadata.lengthPricing.selectedLength,
        unitType: metadata.lengthPricing.unitType || 'inch', // Default to inch if not provided
        calculatedPrice: metadata.lengthPricing.calculatedPrice
      };
    }
  
    // Legacy format - check if this is a length-based product by direct properties
    if (metadata.length) {
      return {
        length: parseFloat(metadata.length),
        unitType: metadata.unitType || 'inch'
      };
    }
  
    return null;
  };