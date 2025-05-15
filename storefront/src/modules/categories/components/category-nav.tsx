"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { ChevronDown } from "@medusajs/icons"
import { Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type CategoryWithChildren = HttpTypes.StoreProductCategory & {
  isOpen?: boolean
}

const CategoryNav = ({ 
  categories, 
  selectedCategory 
}: { 
  categories: CategoryWithChildren[];
  selectedCategory?: string | null;
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  
  // Initialize expanded state based on selected category path
  useEffect(() => {
    if (selectedCategory) {
      const expandedState: Record<string, boolean> = {}
      
      // Find the selected category and its ancestors
      const findAndExpandAncestors = (cats: CategoryWithChildren[], path: string[] = []) => {
        for (const cat of cats) {
          const currentPath = [...path, cat.id]
          
          if (cat.id === selectedCategory) {
            // Expand all ancestors
            currentPath.forEach(id => {
              expandedState[id] = true
            })
            return true
          }
          
          if (cat.category_children && cat.category_children.length > 0) {
            if (findAndExpandAncestors(cat.category_children, currentPath)) {
              return true
            }
          }
        }
        return false
      }
      
      findAndExpandAncestors(categories)
      setExpandedCategories(expandedState)
    }
  }, [categories, selectedCategory])

  const toggleCategory = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const renderCategory = (category: CategoryWithChildren, level = 0) => {
    const isExpanded = expandedCategories[category.id] || false
    const hasChildren = category.category_children && category.category_children.length > 0
    const isSelected = selectedCategory === category.id
    
    return (
      <li 
        key={category.id} 
        className={clx(
          "w-full transition-all", 
          { 
            "mb-2": level === 0,
            "mb-1": level > 0
          }
        )}
      >
        <div className="flex items-center group">
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleCategory(e, category.id)}
                className="mr-2 flex items-center justify-center focus:outline-none h-5 w-5 text-ui-fg-subtle group-hover:text-ui-fg-base"
                aria-label={isExpanded ? "Collapse category" : "Expand category"}
                data-testid="category-toggle-button"
              >
                <ChevronDown 
                  className={clx("transition-transform duration-200", {
                    "transform rotate-180": isExpanded
                  })}
                  // size={16}
                />
              </button>
            ) : (
              <span className="mr-2 w-5 h-5"></span>
            )}
            
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              className={clx(
                "text-ui-fg-subtle hover:text-ui-fg-base py-1 transition-colors duration-150 flex-1",
                {
                  "text-ui-fg-base font-semibold": isSelected,
                }
              )}
              data-testid="category-link"
            >
              <span className={clx({ "font-medium": level === 0 })}>
                {category.name}
              </span>
              {hasChildren && (
                <span className="text-ui-fg-subtle text-xs ml-1">
                  ({category.category_children.length})
                </span>
              )}
            </LocalizedClientLink>
          </div>
        </div>
        
        {/* {hasChildren && isExpanded && (
          <ul className={clx(
            "mt-1 ml-4 pl-2 space-y-1 overflow-hidden transition-all duration-300",
            {
              "border-l border-ui-border-base": level < 2
            }
          )}>
            {category.category_children.map(child => 
              renderCategory(child, level + 1)
            )}
          </ul>
        )} */}
      </li>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="mb-8">
        <Text className="txt-compact-small-plus text-ui-fg-muted mb-4 uppercase font-medium">
          Categories
        </Text>
        <Text className="text-ui-fg-subtle">No categories found</Text>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Text className="txt-compact-small-plus text-ui-fg-muted mb-4 uppercase font-medium">Categories</Text>
      <ul className="flex flex-col">
        {categories.map(category => renderCategory(category))}
      </ul>
    </div>
  )
}

export default CategoryNav