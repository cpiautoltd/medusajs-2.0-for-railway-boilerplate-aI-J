import { ExtrudedProduct, Unit, UNIT_CONVERSIONS } from "types/global";

// const UNIT_CONVERSIONS = {
//   inch: {
//     cm: 2.54, // 1 inch = 2.54 cm
//     mm: 25.4, // 1 inch = 25.4 mm
//   },
//   cm: {
//     inch: 0.393701, // 1 cm = 0.393701 inch
//     mm: 10, // 1 cm = 10 mm
//   },
//   mm: {
//     inch: 0.0393701, // 1 mm = 0.0393701 inch
//     cm: 0.1, // 1 mm = 0.1 cm
//   },
// };

/**
 * Converts a length from one unit to another
 */
export const convertLength = (
  value: number,
  fromUnit: Unit,
  toUnit: Unit
): number => {
  if (fromUnit === toUnit) return value;
  
  const conversionFactor = UNIT_CONVERSIONS[fromUnit][toUnit];
  return parseFloat((value * conversionFactor).toFixed(2));
};

/**
 * Calculates the price for a length-based product
 */
export const calculateLengthBasedPrice = (
  extrudedProduct: ExtrudedProduct,
  selectedLength: number,
  basePrice: number = 0
): number => {
  if (!extrudedProduct.is_length_based || selectedLength === null) {
    return basePrice;
  }

  // Ensure the length is within valid range
  const length = Math.max(
    extrudedProduct.minLength,
    Math.min(extrudedProduct.maxLength, selectedLength)
  );

  // Calculate: (price_per_unit * length) + cut_price
  const calculatedPrice = (extrudedProduct.price_per_unit * length) + extrudedProduct.cut_price;
  
  return calculatedPrice;
};

/**
 * Formats a calculated price in the specified currency
 */
export const formatCalculatedPrice = (
  amount: number,
  currencyCode: string
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
};

/**
 * Validates a length to ensure it's within the allowed range
 */
export const validateLength = (
  length: number,
  extrudedProduct: ExtrudedProduct
): { isValid: boolean; error?: string } => {
  if (isNaN(length)) {
    return { isValid: false, error: "Please enter a valid number" };
  }
  
  if (length < extrudedProduct.minLength) {
    return { 
      isValid: false, 
      error: `Minimum length is ${extrudedProduct.minLength} ${extrudedProduct.unitType}` 
    };
  }
  
  if (length > extrudedProduct.maxLength) {
    return { 
      isValid: false, 
      error: `Maximum length is ${extrudedProduct.maxLength} ${extrudedProduct.unitType}` 
    };
  }
  
  return { isValid: true };
};