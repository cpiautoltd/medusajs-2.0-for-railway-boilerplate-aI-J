import { sdk } from "@lib/config"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
// import { getAuthHeaders } from "./cookies"

/**
 * Get a list of all categories
 */
export const listCategories = cache(async function () {
  try {

    // const { product_categories } = await sdk.store.category
    //   .list(
    //     { fields: "+category_children" },
    //     { next: { tags: ["categories"] } }
    //   );

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/product-categories`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.toString() || "",
          // ...getAuthHeaders(),
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to get categories from backend")
    }

    
    
    const {product_categories} = await response.json()
    console.log("Listing categories in server lib ", product_categories.length)

    // console.log(product_categories)
    return product_categories
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
})

/**
 * Get a list of categories with pagination
 */
export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  try {
    const result = await sdk.store.category.list(
      { limit, offset },
      { next: { tags: ["categories"] } }
    )
    return result
  } catch (error) {
    console.error("Error fetching categories list:", error)
    return { product_categories: [] }
  }
})

/**
 * Get a category by handle, including all its parent categories in the path
 */
export const getCategoryByHandle = cache(async function (
  categoryHandles: string[]
) {
  try {
    // First, we'll try to find the deepest category by its handle
    const targetHandle = categoryHandles[categoryHandles.length - 1]

    const { product_categories } = await sdk.store.category.list(
      {
        handle: targetHandle,
        fields: "*,category_children.*,parent_category.*",
      },
      { next: { tags: ["categories"] } }
    )

    if (!product_categories.length) {
      return { product_categories: [] }
    }

    const targetCategory = product_categories[0]

    // If this is a top-level category, return it directly
    if (!targetCategory.parent_category) {
      return { product_categories: [targetCategory] }
    }

    // Otherwise, we need to build the full path
    const categoryPath: HttpTypes.StoreProductCategory[] = [targetCategory]
    let currentCategory = targetCategory

    // Traverse up the parent hierarchy to build the full path
    while (currentCategory.parent_category) {
      categoryPath.unshift(currentCategory.parent_category)
      currentCategory = currentCategory.parent_category
    }

    return { product_categories: categoryPath }
  } catch (error) {
    console.error("Error fetching category by handle:", error)
    return { product_categories: [] }
  }
})

/**
 * Find a specific category by ID
 */
export const getCategoryById = cache(async function (categoryId: string) {
  try {
    const { product_categories } = await sdk.store.category.list(
      { id: categoryId },
      { next: { tags: ["categories"] } }
    )
    return product_categories[0] || null
  } catch (error) {
    console.error("Error fetching category by ID:", error)
    return null
  }
})
