// src/api/admin/extruded-products/by-product/[productId]/route.ts
import { 
  MedusaRequest, 
  MedusaResponse
} from "@medusajs/framework"
import { EXTRUDED_PRODUCTS_MODULE } from "../../../../../modules/extruded-products"
import ExtrudedProductsModuleService from "../../../../../modules/extruded-products/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { productId } = req.params
  const extrudedProductsService: ExtrudedProductsModuleService = req.scope.resolve(
    EXTRUDED_PRODUCTS_MODULE
  )

  console.log("calling API with productID", productId);

  try {
    // List extruded products filtered by attached_product_id
    const extrudedProducts = await extrudedProductsService.listExtrudedProducts({
      attached_product_id: productId
    })

    console.log("Getting response from extrudedProducts", extrudedProducts)

    // Since a product should have only one extruded_products record
    const extrudedProduct = extrudedProducts[0] || null

    res.status(200).json({ extruded_product: extrudedProduct })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch extruded product", 
      details: error.message 
    })
  }
}