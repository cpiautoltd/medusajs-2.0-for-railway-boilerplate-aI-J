// // backend/src/api/store/customers/me/wishlist/route.ts
// import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
// import { ICustomerModuleService } from "@medusajs/framework/types"
// import { Modules } from "@medusajs/framework/utils"
// import { authenticateClerkCustomer } from "../../../../middlewares/clerk-auth"
// import "../../../../types"

// interface WishlistBody {
//   variant_id: string
// }

// export const GET = [
//   authenticateClerkCustomer,
//   async (req: MedusaRequest, res: MedusaResponse) => {
//     const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
//     const customer = await customerService.retrieveCustomer(req.customer_id!)

//     const wishlist = customer.metadata?.wishlist || []

//     res.json({ wishlist })
//   }
// ]

// export const POST = [
//   authenticateClerkCustomer,
//   async (req: MedusaRequest<WishlistBody>, res: MedusaResponse) => {
//     const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
//     const { variant_id } = req.body

//     if (!variant_id) {
//       return res.status(400).json({ error: "variant_id is required" })
//     }

//     const customer = await customerService.retrieveCustomer(req.customer_id!)
//     const wishlist = customer.metadata?.wishlist || []

//     if (!wishlist.includes(variant_id)) {
//       wishlist.push(variant_id)
//     }

//     await customerService.updateCustomers(req.customer_id!, {
//       metadata: {
//         ...customer.metadata,
//         wishlist
//       }
//     })

//     res.json({ wishlist })
//   }
// ]

// export const DELETE = [
//   authenticateClerkCustomer,
//   async (req: MedusaRequest<WishlistBody>, res: MedusaResponse) => {
//     const customerService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
//     const { variant_id } = req.body

//     if (!variant_id) {
//       return res.status(400).json({ error: "variant_id is required" })
//     }

//     const customer = await customerService.retrieveCustomer(req.customer_id!)
//     const wishlist = (customer.metadata?.wishlist || []).filter(
//       (id: string) => id !== variant_id
//     )

//     await customerService.updateCustomers(req.customer_id!, {
//       metadata: {
//         ...customer.metadata,
//         wishlist
//       }
//     })

//     res.json({ wishlist })
//   }
// ]