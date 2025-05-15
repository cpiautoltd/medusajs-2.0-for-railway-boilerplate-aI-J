import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  category_id
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  category_id: string | undefined
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  console.log("INside store template and the category ID is :", category_id)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} data-testid="refinement-list" />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">All products</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            categoryId={category_id}
          />
        </Suspense>
      </div>
    </div>
  )
}

// This component extracts categoryId from URL client-side
// to avoid server/client hydration mismatch
// "use client"
// import { useSearchParams } from "next/navigation"

// function PaginatedProductsWithCategoryId(props: {
//   sortBy?: SortOptions
//   page: number
//   countryCode: string
// }) {
//   const searchParams = useSearchParams()
//   const categoryId = searchParams.get("categoryId")

//   return (
//     <PaginatedProducts
//       {...props}
//       categoryId={categoryId}
//     />
//   )
// }

export default StoreTemplate