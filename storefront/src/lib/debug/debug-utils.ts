// src/lib/debug/debug-utils.ts

/**
 * Utility function to log category tree structure
 */
export function logCategoryTree(categories: any[], label = "Category Tree") {
    console.group(`--- ${label} ---`);
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.log("No categories or invalid data:", categories);
      console.groupEnd();
      return;
    }
    
    // Find root categories
    const rootCategories = categories.filter(cat => !cat.parent_category_id);
    console.log(`Root categories (${rootCategories.length}):`, 
      rootCategories.map(c => c.name));
    
    // Print the tree structure
    const printTree = (category: any, level = 0) => {
      const indent = "  ".repeat(level);
      const hasChildren = category.category_children && 
                        Array.isArray(category.category_children) && 
                        category.category_children.length > 0;
                        
      console.log(`${indent}${category.name} (${category.id})${hasChildren ? ` - ${category.category_children.length} children` : ""}`);
      
      if (hasChildren) {
        category.category_children.forEach((child: any) => printTree(child, level + 1));
      }
    };
    
    rootCategories.forEach(cat => printTree(cat));
    console.groupEnd();
  }
  
  /**
   * Utility function to log URL query parameters
   */
  export function logUrlParams(params: URLSearchParams, label = "URL Parameters") {
    console.group(`--- ${label} ---`);
    const entries = Array.from(params.entries());
    
    if (entries.length === 0) {
      console.log("No URL parameters");
    } else {
      entries.forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
    
    console.groupEnd();
  }
  
  /**
   * Add this to your client components to debug props
   */
  export function debugProps(props: any, componentName: string) {
    console.group(`--- ${componentName} Props ---`);
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'children') {
        console.log(`${key}: [React Children]`);
      } else if (typeof value === 'function') {
        console.log(`${key}: [Function]`);
      } else {
        console.log(`${key}:`, value);
      }
    });
    console.groupEnd();
  }