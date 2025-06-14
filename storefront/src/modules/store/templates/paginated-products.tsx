import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 20

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string | null
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  // Add category filtering

  console.log("In Paginated prodcts the category ID ", categoryId)

  if (categoryId) {
    queryParams["category_id"] = categoryId
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let {
    response: { products, count },
  } = await getProductsListWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      {products.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16">
          <h2 className="text-xl-semi text-ui-fg-base">No products found</h2>
          <p className="text-base-regular text-ui-fg-subtle mt-2">
            Try adjusting your filters or search term
          </p>
        </div>
      ) : (
        <>
          <ul
            className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-5 gap-x-3 gap-y-3"
            data-testid="products-list"
          >
            {products.map((p) => {
              return (
                <li key={p.id}>
                  <ProductPreview product={p} region={region} />
                </li>
              )
            })}
          </ul>
          {totalPages > 1 && (
            <Pagination
              data-testid="product-pagination"
              page={page}
              totalPages={totalPages}
              totalResults={count}
              perPage={PRODUCT_LIMIT}
            />
          )}
        </>
      )}
    </>
  )
}
