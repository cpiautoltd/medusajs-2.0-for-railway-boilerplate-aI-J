// backend/src/api/store/carts/[id]/customer/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ICartModuleService, ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { authenticateClerkCustomer } from "../../../../middlewares/clerk-auth"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"
import "../../../../types"

export const POST = [
  authenticateClerkCustomer,
  async (req: MedusaRequest, res: MedusaResponse) => {
    const { id } = req.params

    try {
      // Use the updateCartWorkflow to associate cart with customer
      const { result } = await updateCartWorkflow(req.scope).run({
        input: {
          id,
          customer_id: req.customer_id,
          email: req.customer!.email,
        }
      })

      res.json({ cart: result })
    } catch (error) {
      res.status(400).json({ 
        error: "Failed to associate cart with customer",
        details: error.message 
      })
    }
  }
]
