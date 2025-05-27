// Alternative: src/api/admin/extruded-products/[id]/route.ts (simplified version)
import { 
  MedusaRequest, 
  MedusaResponse,
  validateAndTransformBody 
} from "@medusajs/framework"
import { z } from "zod"
import { ExtrudedProductsInput, ExtrudedProducts } from "../../../../modules/extruded-products/models/extruded-products"
import { EXTRUDED_PRODUCTS_MODULE } from "../../../../modules/extruded-products"
import ExtrudedProductsModuleService from "../../../../modules/extruded-products/service"

// Schema for validation
const ExtrudedProductsSchema = z.object({
    id: z.string(),
  is_length_based: z.boolean(),
  price_per_unit: z.number(),
  cut_price: z.number().nullable(),
  cut_code: z.string().nullable(),
  unitType: z.string(),
  minLength: z.number().nullable(),
  maxLength: z.number().nullable(),
  is_endtap_based: z.boolean(),
  endtap_options: z.string(),
  endtap_code: z.string().nullable(),
  attached_product_id: z.string().nullable()
})

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const extrudedProductsService: ExtrudedProductsModuleService = req.scope.resolve(
    EXTRUDED_PRODUCTS_MODULE
  )

  try {
    const extrudedProduct:ExtrudedProducts = await extrudedProductsService.retrieveExtrudedProducts(id)

    res.status(200).json({ extruded_product: extrudedProduct })
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Extruded product not found"
      })
    }
    
    res.status(500).json({ 
      error: "Failed to fetch extruded product", 
      details: error.message 
    })
  }
}

export const PUT = async (
  req: MedusaRequest<ExtrudedProducts>,
  res: MedusaResponse
) => {
  // Validate request body
  await new Promise<void>((resolve, reject) => {
    const middleware = validateAndTransformBody(ExtrudedProductsSchema);
    middleware(req, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (!req.validatedBody) {
    return res.status(400).json({
      message: "Invalid request body",
      error: true,
    });
  }

  const { id } = req.params
  const extrudedProductsService: ExtrudedProductsModuleService = req.scope.resolve(
    EXTRUDED_PRODUCTS_MODULE
  )

  try {
    const updatedProduct = await extrudedProductsService.updateExtrudedProducts(
      req.validatedBody
    )

    res.status(200).json({ extruded_product: updatedProduct })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to update extruded product", 
      details: error.message 
    })
  }
}

export const POST = async (
  req: MedusaRequest<ExtrudedProductsInput>,
  res: MedusaResponse
) => {
  // Validate request body
  await new Promise<void>((resolve, reject) => {
    const middleware = validateAndTransformBody(ExtrudedProductsSchema);
    middleware(req, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  if (!req.validatedBody) {
    return res.status(400).json({
      message: "Invalid request body",
      error: true,
    });
  }

  const extrudedProductsService: ExtrudedProductsModuleService = req.scope.resolve(
    EXTRUDED_PRODUCTS_MODULE
  )

  try {
    const createdProduct = await extrudedProductsService.createExtrudedProducts(
      req.validatedBody
    )

    res.status(201).json({ extruded_product: createdProduct })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to create extruded product", 
      details: error.message 
    })
  }
}