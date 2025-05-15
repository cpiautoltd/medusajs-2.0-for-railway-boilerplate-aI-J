// src/modules/store/components/category-provider/index.tsx

import { listCategories } from "@lib/data/categories"
import { StoreProductCategory } from "@medusajs/types"
import CategoryFilterClient from "../category-filter/client"

/**
 * Server component that fetches categories and passes them to the client component
 */
export default async function CategoryProvider() {

  console.log("Category Provider START")

  // Fetch categories on the server
  const categories = await listCategories()

  console.log("Categories Fetched in the Category Provider: ", categories);
  
  // Convert categories to a safe format for client components
  // This ensures we're not trying to serialize complex objects with methods/etc
  const serializedCategories = categories?.map((category: StoreProductCategory) => ({
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description || "",
    parent_category_id: category.parent_category_id || null,
    category_children: (category.category_children || []).map(child => ({
      id: child.id,
      name: child.name,
      handle: child.handle,
      description: child.description || "",
      parent_category_id: child.parent_category_id || null
    }))
  })) || []

    console.log("Category Provider END: ", serializedCategories)
  
  // Pass the serialized categories as a JSON string prop to the client component
  return <CategoryFilterClient categories={JSON.stringify(serializedCategories)} />
}

// Client component that receives the serialized categories
