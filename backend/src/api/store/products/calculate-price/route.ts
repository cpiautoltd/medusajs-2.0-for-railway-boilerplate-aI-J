// src/api/store/products/calculate-price/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { validateAndTransformBody } from "@medusajs/framework/http";
import { LENGTH_PRICING_MODULE } from "modules/length-pricing";
import LengthPricingService from "modules/length-pricing/service";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Define the request body schema
const CalculatePriceBodySchema = z.object({
  variant_id: z.string(),
  selected_length: z.number().min(0, "Selected length must be greater than 0"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  currency_code: z.string().optional().default("cad"),
  endtapConfig: z.object({
    left: z.string().optional(),
    right: z.string().optional()
  }).nullable()
});

type CalculatePriceRequestBody = z.infer<typeof CalculatePriceBodySchema>;

export const POST = async (
  req: MedusaRequest<CalculatePriceRequestBody>,
  res: MedusaResponse
) => {
  try {
    console.log("req.body at calculate price : ", req.body);

    // Apply validation middleware
    // This returns a Promise<void> and attaches validatedBody to req
    await new Promise<void>((resolve, reject) => {
      const middleware = validateAndTransformBody(CalculatePriceBodySchema);
      middleware(req, res, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Now we can safely access req.validatedBody
    if (!req.validatedBody) {
      // If validation failed but didn't return a response, handle it here
      return res.status(400).json({
        message: "Invalid request body",
        error: true,
      });
    }
    
    console.log("calculate price : req.validatedBody : ", req.validatedBody);

    const {
      variant_id,
      selected_length,
      quantity,
      currency_code,
      endtapConfig
    } = req.validatedBody;

    // Get the necessary services
    const lengthPricingService: LengthPricingService = req.scope.resolve(
      LENGTH_PRICING_MODULE
    );
    const queryService = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    
    // Fetch the variant without calculated price first
    const { data } = await queryService.graph({
      entity: "variant",
      filters: { id: variant_id },
      fields: [
        "id",
        "product.*",
        "product.extruded_products.*",
        "prices.*",  // Get raw prices instead of calculated prices
      ]
    });

    const variant = data[0];

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found",
        error: true,
      });
    }

    // Extract the extruded product data
    const extrudedProduct = variant.product?.extruded_products;

    if (!extrudedProduct || !extrudedProduct.is_length_based) {
      return res.status(400).json({
        message: "Product is not length-based",
        error: true,
      });
    }

    // Validate length is within allowed range
    if (
      selected_length < extrudedProduct.minLength ||
      selected_length > extrudedProduct.maxLength
    ) {
      return res.status(400).json({
        message: `Length must be between ${extrudedProduct.minLength} and ${extrudedProduct.maxLength} ${extrudedProduct.unitType}`,
        error: true,
      });
    }

    // Get the base price from the variant prices
    // Find the price for the requested currency
    const price = variant.prices?.find(p => p.currency_code === currency_code);
    
    if (!price) {
      return res.status(400).json({
        message: `No price found for currency ${currency_code}`,
        error: true,
      });
    }
    
    const basePrice = price.amount;
    
    console.log(`Base price in ${currency_code}: ${basePrice}`);

    // Calculate the price based on length using the length pricing service
    const calculatedUnitPrice = await lengthPricingService.calculatePrice(
      extrudedProduct,
      selected_length,
      endtapConfig
    );

    // Calculate total price based on quantity
    const calculatedTotalPrice = calculatedUnitPrice * quantity;

    return res.status(200).json({
      variant_id,
      selected_length,
      quantity,
      unit_price: calculatedUnitPrice,
      calculated_price: calculatedTotalPrice,
      currency_code,
      metadata: {
        lengthPricing: {
          selectedLength: selected_length,
          unitType: extrudedProduct.unitType,
          pricePerUnit: extrudedProduct.price_per_unit,
          cutPrice: extrudedProduct.cut_price,
          endtapConfig,
          endTapOptions: extrudedProduct.endTapOptions ?? ""
        },
      },
    });
  } catch (error) {
    console.error("Error calculating price: api/store/products/calculate-price", error);

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
        error: true,
      });
    }

    return res.status(500).json({
      message: error.message || "An error occurred while calculating the price",
      error: true,
    });
  }
};