// src/workflows/steps/calculate-length-based-price.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ProductVariantDTO } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";
import { LENGTH_PRICING_MODULE } from "../../modules/length-pricing";
import LengthPricingService, {
  EndtapConfig,
} from "../../modules/length-pricing/service";
import { ProductDTO } from "@medusajs/framework/types";
import { ExtrudedProducts } from "modules/extruded-products/models/extruded-products";

export type CalculateLengthBasedPriceInput = {
  variant: ProductVariantDTO & {
    calculated_price?: {
      calculated_amount: number;
    };
  };
  selectedLength: number;
  endTapConfig: EndtapConfig;
  currencyCode: string;
  quantity?: number;
};

export const calculateLengthBasedPriceStep = createStep(
  "calculate-length-based-price",
  async (
    {
      variant,
      selectedLength,
      currencyCode,
      endTapConfig = {},
      quantity = 1,
    }: CalculateLengthBasedPriceInput,
    { container }
  ) => {
    const lengthPricingService: LengthPricingService = container.resolve(
      LENGTH_PRICING_MODULE
    );

    // console.log(
    //   "WORKFLOW >> calculateLengthBasedPriceStep : variant --- Does variant.product? exist",
    //   variant.product
    // );

    const product = variant.product as ProductDTO & {
      extruded_products: ExtrudedProducts | undefined;
    };

    // Get the variant's extruded product data
    const extrudedProduct = product.extruded_products;

    if (!extrudedProduct || !extrudedProduct.is_length_based) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Product is not length-based"
      );
    }

    // Get the variant's base price
    let totalPrice = variant.calculated_price?.calculated_amount || 0;
    if (
      product.extruded_products?.is_length_based &&
      product.extruded_products?.price_per_unit
    ) {
      const calculatedPrice = await lengthPricingService.calculatePrice(
        extrudedProduct,
        selectedLength,
        endTapConfig
      );

      if (calculatedPrice) totalPrice = calculatedPrice;
    }

    return new StepResponse({
      totalPrice,
      extrudedProduct,
    });
  }
);
