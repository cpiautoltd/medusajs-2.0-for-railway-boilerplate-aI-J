"use client"

import { Text } from "@medusajs/ui"

const CategoryNavLoading = () => {
  return (
    <div className="mb-8">
      <Text className="txt-compact-small-plus text-ui-fg-muted mb-4 uppercase font-medium">Categories</Text>
      <div className="animate-pulse">
        {/* Simulate top-level categories */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded w-24"></div>
            </div>
            
            {/* Simulate subcategories for the first item */}
            {i === 0 && (
              <div className="mt-2 ml-6 pl-2 border-l border-ui-border-base">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center my-2">
                    <div className="w-5 h-5 mr-2 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategoryNavLoading