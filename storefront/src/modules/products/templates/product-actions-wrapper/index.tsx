import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"
import LengthBasedProductActions from "@modules/products/components/length-based-product-actions"
import { ExtendedProduct } from "types/global"

/**
 * Fetches real time pricing for a product and renders the appropriate product actions component
 * based on whether it's a standard or length-based product.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
  })

  if (!product) {
    return null
  }

  const extendedProduct = product as ExtendedProduct

  // Check if this is a length-based product
  const isLengthBased = extendedProduct.extruded_products?.is_length_based

  console.log(`checking if the product `, extendedProduct.handle, `is length-based : ${isLengthBased}`)

  if (isLengthBased) {
    return <LengthBasedProductActions product={extendedProduct} region={region} />
  }

  // Render standard product actions for regular products
  return <ProductActions product={extendedProduct} region={region} />
}