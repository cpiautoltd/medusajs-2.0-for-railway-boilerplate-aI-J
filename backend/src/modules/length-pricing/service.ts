import { ExtrudedProducts } from "modules/extruded-products/models/extruded-products";

// src/modules/length-pricing/service.ts
export type LengthPricingOptions = {
  // Any configuration options needed
  customFee?: number;
};

export type EndtapConfig = {left?: string, right?: string}

export default class LengthPricingService {
  protected options_: LengthPricingOptions;

  constructor({}, options: LengthPricingOptions) {
    this.options_ = options;
  }

  /**
   * Calculate the price of a length-based product
   */
  async calculatePrice(
    product: ExtrudedProducts, selectedLength: number, endtapConfig:EndtapConfig = {}
  ): Promise<number> {
    // Validate inputs
    if (
      !product ||
      typeof selectedLength !== "number" ||
      selectedLength < product.minLength ||
      selectedLength > product.maxLength
    ) {
      throw new Error("Invalid input: product or selectedLength out of range");
    }

    if(!product.price_per_unit) {
      return null
    }

    // Initialize total price with base price (length * price_per_unit)
    let totalPrice = selectedLength * product.price_per_unit;

    // Add one-time cut price
    totalPrice += product.cut_price;

    // Handle end tap pricing if is_endtap_based is true
    if (product.is_endtap_based) {
      try {
        const endtapOptions = JSON.parse(product.endtap_options);

        // Process left end tap
        if (endtapConfig.left) {
          const leftOption = endtapOptions.find(
            (option) => option.part_no === endtapConfig.left
          );
          if (!leftOption) {
            throw new Error(
              `Invalid part_no for left end tap: ${endtapConfig.left}`
            );
          }
          totalPrice += leftOption.price;
        }

        // Process right end tap
        if (endtapConfig.right) {
          const rightOption = endtapOptions.find(
            (option) => option.part_no === endtapConfig.right
          );
          if (!rightOption) {
            throw new Error(
              `Invalid part_no for right end tap: ${endtapConfig.right}`
            );
          }
          totalPrice += rightOption.price;
        }
      } catch (error) {
        throw new Error(`Error processing endtap_options: ${error.message}`);
      }
    }

    // Return total price rounded to 2 decimal places
    return Number(totalPrice.toFixed(2));
  }

  /**
   * Validate length is within allowed range
   */
  async validateLength(
    length: number,
    minLength: number,
    maxLength: number
  ): Promise<boolean> {
    return length >= minLength && length <= maxLength;
  }
}
