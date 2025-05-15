"use client"

import { listCategories } from "@lib/data/categories"
import { Text, clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { StoreProductCategory } from "@medusajs/types"

// type SerializedCategory = {
//   id: string
//   name: string
//   handle: string
//   description: string
//   parent_category_id: string | null
//   category_children?: SerializedCategory[]
// }

type CategoryFilterProps = {
  // categories: SerializedCategory[]
  "data-testid"?: string
}

const CategoryFilter = ({
  // categories,
  "data-testid": dataTestId,
}: CategoryFilterProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categories,setCategories] = useState<StoreProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>("");
  // console.log("Initiating category filter")

  useEffect(() => {
    console.log( "Fetching categories client side !!");
    async function getCategories(){
      const categories:StoreProductCategory[] = await listCategories();

      if ( categories.length ) {
        setCategories(categories);

        let cId = searchParams.get("category-id")

        console.log("setting the selectedCategoryId to cID", cId)
        setSelectedCategoryId(cId || undefined)
      }
    }

    getCategories()
  }, [])

  useEffect(() => {
    
  }, [searchParams])
  

  // useEffect(()=> {
    
  // }, [])

  // Get current categoryId from URL
  // const selectedCategoryId = searchParams.get("category-id") || undefined

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams)
      
      if (value === null) {
        params.delete(name)
      } else {
        params.set(name, value)
      }

      return params.toString()
    },
    [searchParams]
  )

  const handleCategoryChange = (categoryId: string | undefined) => {
    // Update URL with new category or remove category param if undefined
    const query = categoryId 
      ? createQueryString("category-id", categoryId) 
      : createQueryString("category-id", null)
      
    router.push(`${pathname}?${query}`)
  }

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid={dataTestId}>
      <Text className="txt-compact-small-plus text-ui-fg-muted">Categories</Text>
      <div className="flex flex-col gap-y-2">
        <button
          className={clx(
            "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base",
            {
              "text-ui-fg-base font-semibold": !selectedCategoryId,
            }
          )}
          onClick={() => handleCategoryChange(undefined)}
          data-testid="category-all-button"
        >
          All Categories
        </button>
        {categories.map((category) => (
          <div key={category.id}>
            <button
              className={clx(
                "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base",
                {
                  "text-ui-fg-base font-semibold": selectedCategoryId === category.id,
                }
              )}
              onClick={() => handleCategoryChange(category.id)}
              data-testid={`category-button-${category.handle}`}
            >
              {category.name}
            </button>
            
            {/* Render child categories with indentation if this category is selected */}
            {category.category_children && category.category_children.length > 0 && (
              <div className="ml-4">
                {category.category_children.map((child) => (
                  <button
                    key={child.id}
                    className={clx(
                      "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base mt-1",
                      {
                        "text-ui-fg-base font-semibold": selectedCategoryId === child.id,
                      }
                    )}
                    onClick={() => handleCategoryChange(child.id)}
                    data-testid={`category-button-${child.handle}`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter