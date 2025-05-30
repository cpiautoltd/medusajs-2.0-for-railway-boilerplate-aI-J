"use client"

import { listCategories } from "@lib/data/categories"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { StoreProductCategory } from "@medusajs/types"
import { Text, clx } from "@medusajs/ui"

// Configuration constants
const MAX_CATEGORY_DEPTH = 8
const INITIAL_EXPANDED_DEPTH = 1 // How many levels to auto-expand initially
const INDENT_PER_LEVEL = 16 // pixels

type CategoryWithChildren = StoreProductCategory & {
  category_children?: CategoryWithChildren[]
  depth?: number
  childCount?: number
  hasGrandchildren?: boolean
}

// Cache for categories to avoid repeated API calls
let categoriesCache: CategoryWithChildren[] | null = null
let categoryHierarchyCache: Map<string, CategoryWithChildren> | null = null

const CategoryFilter = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Build optimized category hierarchy from flat array
  const categoryHierarchy = useMemo(() => {
    if (categories.length === 0) return new Map()
    
    const categoryMap = new Map<string, CategoryWithChildren>()
    
    // First pass: create map with basic properties
    categories.forEach(cat => {
      categoryMap.set(cat.id, { 
        ...cat, 
        category_children: [],
        depth: 0,
        childCount: 0,
        hasGrandchildren: false
      })
    })
    
    // Second pass: build hierarchy and set children
    categories.forEach(cat => {
      const categoryInMap = categoryMap.get(cat.id)
      if (!categoryInMap) return

      // Find direct children from the flat array
      const directChildren = categories.filter(child => child.parent_category_id === cat.id)
      
      // Map children to their enhanced versions
      categoryInMap.category_children = directChildren
        .map(child => categoryMap.get(child.id))
        .filter((child): child is CategoryWithChildren => child !== undefined)
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
      
      categoryInMap.childCount = directChildren.length

      // Check for grandchildren
      categoryInMap.hasGrandchildren = directChildren.some(child => 
        categories.some(grandchild => grandchild.parent_category_id === child.id)
      )
    })

    // Third pass: calculate depths
    const calculateDepth = (categoryId: string): number => {
      const category = categoryMap.get(categoryId)
      if (!category?.parent_category_id) return 0
      return 1 + calculateDepth(category.parent_category_id)
    }

    categoryMap.forEach((cat, id) => {
      cat.depth = calculateDepth(id)
    })
    
    return categoryMap
  }, [categories])

  // Get root categories (no parent, within depth limit)
  const rootCategories = useMemo(() => {
    const roots = categories
      .filter(cat => cat.parent_category_id === null)
      .sort((a, b) => (a.rank || 0) - (b.rank || 0))
    
    console.log('Root categories found:', roots.length, roots.map(r => r.name))
    return roots
  }, [categories])

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return rootCategories

    const matchingCategories = new Set<string>()
    const searchLower = searchTerm.toLowerCase()

    // Find all categories that match the search term
    categories.forEach(cat => {
      if (cat.name.toLowerCase().includes(searchLower)) {
        matchingCategories.add(cat.id)
        
        // Add all ancestors to show the path
        let currentCat = cat
        while (currentCat.parent_category_id) {
          matchingCategories.add(currentCat.parent_category_id)
          currentCat = categories.find(c => c.id === currentCat.parent_category_id) || currentCat
          if (!currentCat.parent_category_id) break
        }
      }
    })

    // Filter and rebuild hierarchy for matching categories
    const filterHierarchy = (cats: CategoryWithChildren[]): CategoryWithChildren[] => {
      return cats
        .filter(cat => matchingCategories.has(cat.id))
        .map(cat => ({
          ...cat,
          category_children: cat.category_children ? filterHierarchy(cat.category_children) : []
        }))
    }

    return filterHierarchy(rootCategories)
  }, [rootCategories, searchTerm, categories])

  // Load categories with caching
  useEffect(() => {
    const loadCategories = async () => {
      if (categoriesCache) {
        setCategories(categoriesCache)
        setLoading(false)
      } else {
        try {
          const data = await listCategories()
          categoriesCache = data
          setCategories(data)
        } catch (error) {
          console.error('Failed to load categories:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadCategories()
  }, [])

  // Set initial expanded state and selected category
  useEffect(() => {
    if (categories.length > 0) {
      const categoryId = searchParams.get("category-id")
      setSelectedCategory(categoryId || undefined)
      
      const defaultExpanded = new Set<string>()
      
      // Auto-expand categories up to INITIAL_EXPANDED_DEPTH
      const expandToDepth = (cats: CategoryWithChildren[], currentDepth: number) => {
        if (currentDepth >= INITIAL_EXPANDED_DEPTH) return
        
        cats.forEach(cat => {
          if (cat.category_children && cat.category_children.length > 0) {
            defaultExpanded.add(cat.id)
            expandToDepth(cat.category_children, currentDepth + 1)
          }
        })
      }
      
      expandToDepth(rootCategories, 0)
      
      // If a category is selected, expand its entire parent hierarchy
      if (categoryId) {
        let currentCat = categories.find(cat => cat.id === categoryId)
        while (currentCat?.parent_category_id) {
          defaultExpanded.add(currentCat.parent_category_id)
          currentCat = categories.find(cat => cat.id === currentCat?.parent_category_id)
        }
      }
      
      // Auto-expand search results
      if (searchTerm.trim()) {
        filteredCategories.forEach(cat => {
          if (cat.category_children && cat.category_children.length > 0) {
            defaultExpanded.add(cat.id)
          }
        })
      }
      
      setExpandedCategories(defaultExpanded)
    }
  }, [categories, searchParams, rootCategories, filteredCategories, searchTerm])

  // Handle category selection and URL update
  const handleCategorySelect = useCallback((categoryId?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (categoryId) {
      params.set("category-id", categoryId)
    } else {
      params.delete("category-id")
    }
    
    router.push(`${pathname}?${params.toString()}`)
    setSelectedCategory(categoryId)
  }, [router, pathname, searchParams])

  // Toggle category expansion
  const toggleExpand = useCallback((categoryId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent category selection when clicking expand button
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        // When collapsing, also collapse all children
        const collapseChildren = (catId: string) => {
          const cat = categoryHierarchy.get(catId)
          cat?.category_children?.forEach((child:any) => {
            newSet.delete(child.id)
            collapseChildren(child.id)
          })
        }
        newSet.delete(categoryId)
        collapseChildren(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [categoryHierarchy])

  // Render category tree recursively with performance optimizations
  const renderCategoryTree = useCallback((category: CategoryWithChildren, level: number = 0) => {
    const categoryData = categoryHierarchy.get(category.id) || category
    const hasChildren = categoryData.category_children && categoryData.category_children.length > 0
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategory === category.id
    const maxDepthReached = level >= MAX_CATEGORY_DEPTH

    // Don't render if max depth is reached
    if (level > MAX_CATEGORY_DEPTH) return null

    const indentStyle = { paddingLeft: `${level * INDENT_PER_LEVEL}px` }

    return (
      <div key={category.id} className="select-none">
        <div 
          className={clx(
            "flex items-center py-1 px-2 hover:bg-gray-50 rounded cursor-pointer transition-colors group",
            {
              "bg-blue-50 text-blue-800 font-medium": isSelected,
              "text-gray-700": !isSelected,
              "opacity-60": maxDepthReached,
            }
          )}
          style={indentStyle}
          onClick={() => !maxDepthReached && handleCategorySelect(category.id)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && !maxDepthReached ? (
            <button
              onClick={(e) => toggleExpand(category.id, e)}
              className="p-0.5 mr-2 hover:bg-gray-200 rounded opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`}
            >
              <svg
                className={clx("w-3 h-3 transition-transform duration-150", {
                  "rotate-90": isExpanded,
                })}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <div className="w-4 mr-2" /> // Spacer for alignment
          )}

          {/* Category name and metadata */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className={clx("truncate text-sm", {
              "font-medium": level === 0,
              "font-normal": level > 0,
            })}>
              {category.name}
            </span>
            
            {/* Category metadata */}
            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {hasChildren && (
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                  {categoryData.childCount}
                </span>
              )}
              {maxDepthReached && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                  Max
                </span>
              )}
              {level > 0 && (
                <span className="text-xs text-gray-400">
                  L{level + 1}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Render children if expanded and not at max depth */}
        {hasChildren && isExpanded && !maxDepthReached && (
          <div className="border-l border-gray-100 ml-2">
            {categoryData.category_children!.map((child:any) => renderCategoryTree(child, level + 1))}
          </div>
        )}
      </div>
    )
  }, [expandedCategories, selectedCategory, handleCategorySelect, toggleExpand, categoryHierarchy])

  if (loading) {
    return (
      <div className="space-y-3">
        <Text className="text-sm font-medium text-gray-700">Categories</Text>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Text className="text-sm font-medium text-gray-700">Categories</Text>
      
      {/* Search Categories */}
      {/* <div className="relative">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div> */}

      {/* All Categories Option */}
      <button
        className={clx(
          "w-full text-left px-3 py-2 text-sm rounded-md border transition-colors",
          {
            "bg-blue-600 text-white border-blue-600": !selectedCategory,
            "bg-white text-gray-700 border-gray-300 hover:bg-gray-50": selectedCategory,
          }
        )}
        onClick={() => handleCategorySelect(undefined)}
      >
        All Categories
      </button>

      {/* Category Tree */}
      <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
        <div className="p-2 space-y-0.5">
          {filteredCategories.length > 0 ? (
            filteredCategories.map(category => renderCategoryTree(category))
          ) : searchTerm ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No categories found for {searchTerm}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Loading categories...
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No root categories found
              <div className="text-xs mt-1">
                Debug: {categories.length} total categories, {rootCategories.length} roots
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats and Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 space-y-1 border-t pt-2">
          <div>Total: {categories.length} categories</div>
          <div>Max Depth: {MAX_CATEGORY_DEPTH} levels</div>
          <div>Expanded: {expandedCategories.size} categories</div>
          <button
            onClick={() => {
              categoriesCache = null
              categoryHierarchyCache = null
              window.location.reload()
            }}
            className="text-gray-400 hover:text-gray-600 underline"
          >
            Clear Cache
          </button>
        </div>
      )}
    </div>
  )
}

export default CategoryFilter

// import { listCategories } from "@lib/data/categories"
// import { Text, clx } from "@medusajs/ui"
// import { usePathname, useRouter, useSearchParams } from "next/navigation"
// import { useCallback, useEffect, useState } from "react"
// import { StoreProductCategory } from "@medusajs/types"

// // type SerializedCategory = {
// //   id: string
// //   name: string
// //   handle: string
// //   description: string
// //   parent_category_id: string | null
// //   category_children?: SerializedCategory[]
// // }

// type CategoryFilterProps = {
//   // categories: SerializedCategory[]
//   "data-testid"?: string
// }

// const CategoryFilter = ({
//   // categories,
//   "data-testid": dataTestId,
// }: CategoryFilterProps) => {
//   const router = useRouter()
//   const pathname = usePathname()
//   const searchParams = useSearchParams()
//   const [categories,setCategories] = useState<StoreProductCategory[]>([]);
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>("");
//   // console.log("Initiating category filter")

//   useEffect(() => {
//     console.log( "Fetching categories client side !!");
//     async function getCategories(){
//       const categories:StoreProductCategory[] = await listCategories();

//       if ( categories.length ) {
//         setCategories(categories);

//         let cId = searchParams.get("category-id")

//         console.log("setting the selectedCategoryId to cID", cId)
//         setSelectedCategoryId(cId || undefined)
//       }
//     }

//     getCategories()
//   }, [])

//   useEffect(() => {
    
//   }, [searchParams])
  

//   // useEffect(()=> {
    
//   // }, [])

//   // Get current categoryId from URL
//   // const selectedCategoryId = searchParams.get("category-id") || undefined

//   const createQueryString = useCallback(
//     (name: string, value: string | null) => {
//       const params = new URLSearchParams(searchParams)
      
//       if (value === null) {
//         params.delete(name)
//       } else {
//         params.set(name, value)
//       }

//       return params.toString()
//     },
//     [searchParams]
//   )

//   const handleCategoryChange = (categoryId: string | undefined) => {
//     // Update URL with new category or remove category param if undefined
//     const query = categoryId 
//       ? createQueryString("category-id", categoryId) 
//       : createQueryString("category-id", null)
      
//     router.push(`${pathname}?${query}`)
//   }

//   if (!categories || categories.length === 0) {
//     return null
//   }

//   return (
//     <div className="flex flex-col gap-y-3" data-testid={dataTestId}>
//       <Text className="txt-compact-small-plus text-ui-fg-muted">Categories</Text>
//       <div className="flex flex-col gap-y-2">
//         <button
//           className={clx(
//             "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base",
//             {
//               "text-ui-fg-base font-semibold": !selectedCategoryId,
//             }
//           )}
//           onClick={() => handleCategoryChange(undefined)}
//           data-testid="category-all-button"
//         >
//           All Categories
//         </button>
//         {categories.map((category) => (
//           <div key={category.id}>
//             <button
//               className={clx(
//                 "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base",
//                 {
//                   "text-ui-fg-base font-semibold": selectedCategoryId === category.id,
//                 }
//               )}
//               onClick={() => handleCategoryChange(category.id)}
//               data-testid={`category-button-${category.handle}`}
//             >
//               {category.name}
//             </button>
            
//             {/* Render child categories with indentation if this category is selected */}
//             {category.category_children && category.category_children.length > 0 && (
//               <div className="ml-4">
//                 {category.category_children.map((child) => (
//                   <button
//                     key={child.id}
//                     className={clx(
//                       "text-left txt-compact-small text-ui-fg-subtle hover:text-ui-fg-base mt-1",
//                       {
//                         "text-ui-fg-base font-semibold": selectedCategoryId === child.id,
//                       }
//                     )}
//                     onClick={() => handleCategoryChange(child.id)}
//                     data-testid={`category-button-${child.handle}`}
//                   >
//                     {child.name}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default CategoryFilter