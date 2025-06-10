// backend/src/api/store/carts/customer/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { authenticateClerkCustomer } from "../../../middlewares/clerk-auth"
import "../../../types"

export const GET = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    try {
      // Use listCarts method
      const carts = await cartService.listCarts({
      customer_id: req.auth_context.actor_id,
    }, {
      order: { created_at: "DESC" },
      take: 1,
    })

      if (carts.length === 0) {
        return res.json({ cart: null })
      }

      res.json({ cart: carts[0] })
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch customer cart",
        details: error.message 
      })
    }
  }
]