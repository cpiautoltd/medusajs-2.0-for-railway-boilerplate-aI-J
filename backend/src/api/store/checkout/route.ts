// backend/src/api/store/checkout/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ICartModuleService, IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { authenticateClerkCustomer } from "../../middlewares/clerk-auth"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import "../../types"

interface CheckoutBody {
  cart_id: string
}

export const POST = [
  authenticateClerkCustomer,
  async (req: MedusaRequest<CheckoutBody>, res: MedusaResponse) => {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    const { cart_id } = req.body

    if (!cart_id) {
      return res.status(400).json({ error: "cart_id is required" })
    }

    try {
      // Retrieve cart to validate ownership
      const cart = await cartService.retrieveCart(cart_id)
      
      if (cart.customer_id !== req.customer_id) {
        return res.status(403).json({ error: "Cart does not belong to customer" })
      }

      // Complete the cart using workflow
      const { result } = await completeCartWorkflow(req.scope).run({
        input: {
          id: cart_id
        }
      })

      res.json({ order: result })
    } catch (error) {
      res.status(400).json({ 
        error: "Failed to complete checkout",
        details: error.message 
      })
    }
  }
]