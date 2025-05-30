import { Metadata } from "next"

import { getRegion } from "@lib/data/regions"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "CPI Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    'category-id'?: string
  }
  params: {
    countryCode: string
  }
}
export default async function Home({ searchParams, params }: Params) {
  // const collections = await getCollectionsWithProducts(params.countryCode)
  const region = await getRegion(params.countryCode)
    const { sortBy="title", page="1", 'category-id': categoryId } = searchParams


  if (!region) {
    return null
  }

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      category_id={categoryId}
    />
  )
}
