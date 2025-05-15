import { sdk } from "@lib/config"
import { cache } from "react"
import { Suspense } from "react"
import CategoryNav from "./category-nav"
import CategoryNavLoading from "./category-nav-loading"
import { HttpTypes } from "@medusajs/types"
import { listCategories } from "@lib/data/categories"

// Cache the full category tree to avoid refetching on every render
const getCategoriesTree = cache(async function () {
  try {

    console.log("Getting Category Tree from Medusa in container.tsx : START")
    const {product_categories} = await listCategories();
    // const { product_categories } = await sdk.store.category
    // .list({
    //   // Fetch all fields and 3 levels of children
    //   fields: "*,category_children.*,category_children.category_children.*,category_children.category_children.category_children.*",
    //   // Only get top-level categories (without parent)
    //   parent_category_id: 'null',
    // }, { next: { tags: ["categories"] } });


    
    console.log("Getting Category Tree from Medusa in container.tsx : END", product_categories)
    return sortCategoriesByName(product_categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
});

// Function to sort categories by name recursively
function sortCategoriesByName(categories: HttpTypes.StoreProductCategory[]): HttpTypes.StoreProductCategory[] {
  if (!categories || categories.length === 0) return [];
  
  // First sort the current level
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  
  // Then sort children recursively
  return sortedCategories.map(category => {
    if (category.category_children && category.category_children.length > 0) {
      return {
        ...category,
        category_children: sortCategoriesByName(category.category_children)
      };
    }
    return category;
  });
}

// This is a server component that fetches data
export default async function CategoriesContainer({ selectedCategory }: { selectedCategory?: string | null }) {
  const categories = await getCategoriesTree();
  
  return (
    <Suspense fallback={<CategoryNavLoading />}>
      <CategoryNav categories={categories} selectedCategory={selectedCategory} />
    </Suspense>
  );
}