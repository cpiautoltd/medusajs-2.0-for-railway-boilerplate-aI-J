import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { HttpTypes } from "@medusajs/types"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {

  // Removed as we are fetching the prices directly in listProducts Call temporarily.
  // const [pricedProduct] = await getProductsById({
  //   ids: [product.id!],
  //   regionId: region.id,
  // })

  // if (!pricedProduct) {
  //   return null
  // }

  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block border border-ui-border-base rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-shadow bg-white"
    >
      <div className="w-full overflow-hidden">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="square"
          isFeatured={isFeatured}
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <Text
          className="text-ui-fg-base text-xs font-medium line-clamp-2 group-hover:text-ui-fg-strong transition-colors"
          data-testid="product-title"
        >
          {product.title}
        </Text>
        <div className="flex justify-between items-center mt-auto">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          {isFeatured && (
            <span className="ml-2 px-2 py-0.5 text-2xs font-semibold bg-ui-bg-base border border-ui-border-base rounded-full text-ui-fg-muted uppercase">
              Featured
            </span>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}

// import { Text } from "@medusajs/ui"

// import { getProductPrice } from "@lib/util/get-product-price"
// import LocalizedClientLink from "@modules/common/components/localized-client-link"
// import Thumbnail from "../thumbnail"
// import PreviewPrice from "./price"
// import { getProductsById } from "@lib/data/products"
// import { HttpTypes } from "@medusajs/types"

// export default async function ProductPreview({
//   product,
//   isFeatured,
//   region,
// }: {
//   product: HttpTypes.StoreProduct
//   isFeatured?: boolean
//   region: HttpTypes.StoreRegion
// }) {
//   const [pricedProduct] = await getProductsById({
//     ids: [product.id!],
//     regionId: region.id,
//   })

//   if (!pricedProduct) {
//     return null
//   }

//   const { cheapestPrice } = getProductPrice({
//     product: pricedProduct,
//   })

//   return (
//     <LocalizedClientLink href={`/products/${product.handle}`} className="group">
//       <div data-testid="product-wrapper">
//         <Thumbnail
//           thumbnail={product.thumbnail}
//           images={product.images}
//           size="full"
//           isFeatured={isFeatured}
//         />
//         <div className="flex txt-compact-medium mt-4 justify-between">
//           <Text className="text-ui-fg-subtle" data-testid="product-title">
//             {product.title}
//           </Text>
//           <div className="flex items-center gap-x-2">
//             {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
//           </div>
//         </div>
//       </div>
//     </LocalizedClientLink>
//   )
// }
