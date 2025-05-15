// "use client"

// import { useMemo } from "react"
// import CategoryFilter from "."

// function CategoryFilterClient({ categories }: { categories: string }) {

//     console.log("categories Filter client!!", categories)

//   // Parse the JSON string back to an array
//   const parsedCategories = useMemo(() => {
//     console.log("Category Filter client", categories)
    
//     try {
//       return JSON.parse(categories || "[]")
//     } catch (e) {
//       console.error("Error parsing categories:", e)
//       return []
//     }
//   }, [categories])
  
//   return <CategoryFilter categories={parsedCategories} />
// }

// export default CategoryFilterClient